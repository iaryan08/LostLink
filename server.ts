import express from "express";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { 
  Profile, 
  Item, 
  Claim, 
  Message, 
  Report, 
  AppNotification,
  RecentActivity,
  SafeZone
} from "./src/types.js";

// Load configuration
dotenv.config();

const app = express();
const PORT = 3000;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL ERROR: Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not defined in .env!");
}

// Global anonymous client
const supabase = createClient(supabaseUrl, supabaseKey);

// Dynamic client generator with user JWT for Row Level Security (RLS) enforcement
const getUserSupabaseClient = (req: express.Request) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return supabase;
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return supabase;
  
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
};

// --- DATABASE TO API RESPONSE MODEL MAPPERS (snake_case -> camelCase) ---
const mapProfileToCamelCase = (p: any): Profile => ({
  id: p.id,
  fullName: p.full_name,
  email: p.email,
  avatarUrl: p.avatar_url,
  createdAt: p.created_at,
  isAdmin: p.is_admin || false,
  isBanned: p.is_banned || false,
  gender: p.gender || undefined
});

const mapItemToCamelCase = (i: any): Item => ({
  id: i.id,
  userId: i.user_id,
  type: i.type,
  title: i.title,
  category: i.category,
  description: i.description,
  location: i.location,
  imageUrl: i.image_url,
  status: i.status,
  reward: i.reward || undefined,
  dateEvent: i.date_event,
  createdAt: i.created_at,
  isAnonymous: i.is_anonymous
});

const mapClaimToCamelCase = (c: any): Claim => ({
  id: c.id,
  itemId: c.item_id,
  claimantId: c.claimant_id,
  verificationAnswer: c.verification_answer,
  status: c.status,
  createdAt: c.created_at,
  isReported: c.is_reported || false
});

const mapMessageToCamelCase = (m: any): Message => ({
  id: m.id,
  senderId: m.sender_id,
  receiverId: m.receiver_id,
  itemId: m.item_id,
  message: m.message,
  createdAt: m.created_at
});

const mapReportToCamelCase = (r: any): Report => ({
  id: r.id,
  claimId: r.claim_id,
  itemId: r.item_id,
  reporterId: r.reporter_id,
  reason: r.reason,
  createdAt: r.created_at
});

const mapNotificationToCamelCase = (n: any): AppNotification => ({
  id: n.id,
  userId: n.user_id,
  type: n.type,
  title: n.title,
  content: n.content,
  isRead: n.is_read,
  itemId: n.item_id,
  createdAt: n.created_at
});

const mapSafeZoneToCamelCase = (s: any): SafeZone => ({
  id: String(s.id),
  name: s.name,
  description: s.description,
  location: s.location
});

const mapActivityToCamelCase = (a: any): RecentActivity => ({
  id: a.id,
  userId: a.user_id || "Anonymous",
  userName: a.user_name,
  action: a.action,
  targetTitle: a.target_title,
  createdAt: a.created_at
});

// Middleware
app.use(express.json({ limit: "10mb" }));

// Enable CORS for all routes/origins
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Helper to extract Authorization token from header
const getAuthenticatedUserId = (req: express.Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  return token || null;
};

// --- AUTH ENDPOINTS ---
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !authData.user) {
      return res.status(401).json({ error: authError?.message || "Invalid email or password" });
    }

    // Retrieve corresponding user profile from public.profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: "User profile not found in profiles table." });
    }

    if (profile.is_banned) {
      return res.status(403).json({ error: "Your account has been suspended for safety/moderation issues." });
    }

    res.json({
      user: mapProfileToCamelCase(profile),
      token: authData.session.access_token
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message || "Internal server error during login" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const { fullName, email, password, gender } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Full Name, Email and Password are required" });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          gender: gender || ""
        }
      }
    });

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || "Registration failed" });
    }

    // Wait for the automatic database trigger to populate profiles table
    let profile = null;
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();
      if (data) {
        profile = data;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Fallback profile insert if the trigger hasn't fired or is not configured
    if (!profile) {
      const { data, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          full_name: fullName,
          email: email.toLowerCase().trim(),
          gender: gender || "",
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`
        })
        .select()
        .single();
      
      if (insertError) {
        return res.status(500).json({ error: insertError.message });
      }
      profile = data;
    }

    // If confirmation is enabled, session might be null initially
    if (!authData.session) {
      return res.status(201).json({
        user: mapProfileToCamelCase(profile),
        token: authData.user.id,
        message: "Registration successful. Please verify your email if required."
      });
    }

    res.status(201).json({
      user: mapProfileToCamelCase(profile),
      token: authData.session.access_token
    });
  } catch (err: any) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message || "Internal server error during registration" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: authError?.message || "Unauthorized" });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (profile.is_banned) {
      return res.status(403).json({ error: "Your account has been suspended." });
    }

    res.json(mapProfileToCamelCase(profile));
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.put("/api/profile", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { gender, avatarUrl } = req.body;

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: updatedProfile, error: profileError } = await userClient
      .from("profiles")
      .update({
        gender,
        avatar_url: avatarUrl
      })
      .eq("id", user.id)
      .select()
      .single();

    if (profileError || !updatedProfile) {
      return res.status(400).json({ error: profileError?.message || "Failed to update profile" });
    }

    res.json(mapProfileToCamelCase(updatedProfile));
  } catch (err: any) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: err.message || "Internal server error during profile update" });
  }
});

// --- UPLOAD ENDPOINT ---
app.post("/api/upload", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { base64Data, fileName, contentType } = req.body;
  if (!base64Data || !fileName || !contentType) {
    return res.status(400).json({ error: "Missing required upload fields (base64Data, fileName, contentType)" });
  }

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const buffer = Buffer.from(base64Data, "base64");

    const { error: uploadError } = await userClient
      .storage
      .from("item-images")
      .upload(fileName, buffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return res.status(400).json({ error: uploadError.message });
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from("item-images")
      .getPublicUrl(fileName);

    res.json({ publicUrl });
  } catch (err: any) {
    console.error("Upload API error:", err);
    res.status(500).json({ error: err.message || "Internal server error during upload" });
  }
});

// --- ITEMS ENDPOINTS ---
app.get("/api/items", async (req, res) => {
  try {
    // Hide items created by banned profiles
    const { data: bannedProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("is_banned", true);
    
    const bannedIds = bannedProfiles?.map(p => p.id) || [];

    let query = supabase.from("items").select("*");
    
    if (bannedIds.length > 0) {
      query = query.not("user_id", "in", `(${bannedIds.join(",")})`);
    }

    const { data: items, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json((items || []).map(mapItemToCamelCase));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/items/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data: item, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(mapItemToCamelCase(item));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/items", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile || profile.is_banned) {
      return res.status(403).json({ error: "Action not allowed" });
    }

    const { type, title, category, description, location, imageUrl, reward, dateEvent, isAnonymous } = req.body;
    if (!type || !title || !category || !description || !location || !dateEvent) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newItem = {
      user_id: user.id,
      type,
      title,
      category,
      description,
      location,
      image_url: imageUrl || "https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=500&auto=format&fit=crop&q=60",
      status: type === "lost" ? "lost" : "found",
      reward: reward || null,
      date_event: dateEvent,
      is_anonymous: !!isAnonymous
    };

    const { data: insertedItem, error: insertError } = await userClient
      .from("items")
      .insert(newItem)
      .select()
      .single();

    if (insertError || !insertedItem) {
      return res.status(400).json({ error: insertError?.message || "Failed to insert item" });
    }

    // Log recent activity
    const actorName = insertedItem.is_anonymous ? "Someone" : profile.full_name;
    await supabase.from("activities").insert({
      user_id: insertedItem.is_anonymous ? null : user.id,
      user_name: actorName,
      action: insertedItem.type === "lost" ? "reported missing" : "reported finding",
      target_title: insertedItem.title
    });

    // Run matching notification triggers
    const otherType = insertedItem.type === "lost" ? "found" : "lost";
    const { data: otherItems } = await supabase
      .from("items")
      .select("*")
      .eq("type", otherType)
      .neq("user_id", user.id)
      .not("status", "in", '("resolved","claimed")');

    if (otherItems) {
      const matchedItems = otherItems.filter(i => 
        i.category.toLowerCase() === insertedItem.category.toLowerCase() ||
        i.location.toLowerCase().includes(insertedItem.location.toLowerCase()) ||
        insertedItem.location.toLowerCase().includes(i.location.toLowerCase()) ||
        i.title.toLowerCase().split(" ").some((word: string) => word.length > 3 && insertedItem.title.toLowerCase().includes(word))
      );

      for (const matchedItem of matchedItems) {
        // Notify matching post owner
        await supabase.from("notifications").insert({
          user_id: matchedItem.user_id,
          type: "item_match",
          title: "Potential Match Found!",
          content: `A new ${insertedItem.type} item: '${insertedItem.title}' matches your item '${matchedItem.title}'. Check it out!`,
          item_id: matchedItem.id,
          is_read: false
        });

        // Notify current reporter
        await supabase.from("notifications").insert({
          user_id: insertedItem.user_id,
          type: "item_match",
          title: "Potential Match Found!",
          content: `An existing ${matchedItem.type} item: '${matchedItem.title}' aligns with your post. Connect now!`,
          item_id: insertedItem.id,
          is_read: false
        });
      }
    }

    res.status(201).json(mapItemToCamelCase(insertedItem));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/items/:id", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.params;
  const { status, title, description, reward, location, dateEvent, category, imageUrl } = req.body;

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: existingItem, error: getError } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (getError || !existingItem) return res.status(404).json({ error: "Item not found" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.is_admin || false;

    // Must be owner or admin
    if (existingItem.user_id !== user.id && !isAdmin) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const updatePayload: any = {};
    if (status) updatePayload.status = status;
    if (title) updatePayload.title = title;
    if (description) updatePayload.description = description;
    if (reward !== undefined) updatePayload.reward = reward;
    if (location) updatePayload.location = location;
    if (dateEvent) updatePayload.date_event = dateEvent;
    if (category) updatePayload.category = category;
    if (imageUrl) updatePayload.image_url = imageUrl;

    const { data: updatedItem, error: updateError } = await userClient
      .from("items")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updatedItem) {
      return res.status(400).json({ error: updateError?.message || "Failed to update item" });
    }

    res.json(mapItemToCamelCase(updatedItem));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/items/:id", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.params;

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: existingItem, error: getError } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (getError || !existingItem) return res.status(404).json({ error: "Item not found" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.is_admin || false;

    if (existingItem.user_id !== user.id && !isAdmin) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const { error: deleteError } = await userClient
      .from("items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    res.json({ success: true, message: "Item successfully deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Scoring matching items endpoint
app.get("/api/items/:id/matches", async (req, res) => {
  const { id } = req.params;
  try {
    const { data: currentItem, error: getError } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (getError || !currentItem) return res.status(404).json({ error: "Item not found" });

    const otherType = currentItem.type === "lost" ? "found" : "lost";

    const { data: otherItems, error: queryError } = await supabase
      .from("items")
      .select("*")
      .eq("type", otherType)
      .neq("id", currentItem.id)
      .neq("status", "resolved");

    if (queryError || !otherItems) {
      return res.status(500).json({ error: queryError?.message || "Failed to fetch items" });
    }

    const scoredMatches = otherItems
      .map(item => {
        let score = 0;
        
        // Category Match
        if (item.category.toLowerCase() === currentItem.category.toLowerCase()) {
          score += 50;
        }
        
        // Location Match
        if (item.location.toLowerCase() === currentItem.location.toLowerCase()) {
          score += 30;
        } else if (
          item.location.toLowerCase().includes(currentItem.location.toLowerCase()) || 
          currentItem.location.toLowerCase().includes(item.location.toLowerCase())
        ) {
          score += 15;
        }

        // Title term matching
        const itemTitleWords = item.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        const currentTitleWords = currentItem.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        const commonWords = itemTitleWords.filter((w: string) => currentTitleWords.includes(w));
        
        score += commonWords.length * 10;

        return { item: mapItemToCamelCase(item), score };
      })
      .filter(match => match.score > 0)
      .sort((a, b) => b.score - a.score);

    res.json(scoredMatches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- CLAIMS ENDPOINTS ---
app.get("/api/claims", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.is_admin || false;

    let claims: any[] = [];

    if (isAdmin) {
      const { data, error } = await userClient.from("claims").select("*");
      if (error) return res.status(500).json({ error: error.message });
      claims = data || [];
    } else {
      // Get claimant's claims and claims on items they own
      const { data: myItems } = await supabase
        .from("items")
        .select("id")
        .eq("user_id", user.id);
      
      const myItemsIds = myItems?.map(i => i.id) || [];

      const { data: myClaims, error: err1 } = await userClient
        .from("claims")
        .select("*")
        .eq("claimant_id", user.id);
      
      if (err1) return res.status(500).json({ error: err1.message });

      let itemClaims: any[] = [];
      if (myItemsIds.length > 0) {
        const { data, error: err2 } = await userClient
          .from("claims")
          .select("*")
          .in("item_id", myItemsIds);
        if (err2) return res.status(500).json({ error: err2.message });
        itemClaims = data || [];
      }

      const claimMap = new Map();
      (myClaims || []).forEach(c => claimMap.set(c.id, c));
      itemClaims.forEach(c => claimMap.set(c.id, c));
      claims = Array.from(claimMap.values());
    }

    // Determine reported status per claim by checking the reports table
    const mappedClaims = [];
    for (const c of claims) {
      const { count } = await userClient
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("claim_id", c.id);
      
      const claimObj = mapClaimToCamelCase(c);
      claimObj.isReported = (count || 0) > 0;
      mappedClaims.push(claimObj);
    }

    res.json(mappedClaims);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/claims", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { itemId, verificationAnswer } = req.body;
  if (!itemId || !verificationAnswer) {
    return res.status(400).json({ error: "Missing itemId or verificationAnswer" });
  }

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (itemError || !item) return res.status(404).json({ error: "Item not found" });

    if (item.user_id === user.id) {
      return res.status(400).json({ error: "You cannot claim your own item" });
    }

    const newClaim = {
      item_id: itemId,
      claimant_id: user.id,
      verification_answer: verificationAnswer,
      status: "pending"
    };

    const { data: insertedClaim, error: insertError } = await userClient
      .from("claims")
      .insert(newClaim)
      .select()
      .single();

    if (insertError || !insertedClaim) {
      const errMsg = insertError?.message || "";
      if (errMsg.includes("unique constraint") && errMsg.includes("unique_claimant_item")) {
        return res.status(400).json({ error: "You have already submitted a claim for this item." });
      }
      return res.status(400).json({ error: errMsg || "Failed to submit claim" });
    }

    const { data: claimantUser } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const claimantName = claimantUser?.full_name || "A student";

    // Notify item poster
    await supabase.from("notifications").insert({
      user_id: item.user_id,
      type: "claim",
      title: "New Claim Received",
      content: `${claimantName} claimed your item: '${item.title}'. Answer provided: "${verificationAnswer}"`,
      item_id: item.id,
      is_read: false
    });

    res.status(201).json(mapClaimToCamelCase(insertedClaim));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/claims/:id", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: claim, error: claimError } = await userClient
      .from("claims")
      .select("*")
      .eq("id", id)
      .single();

    if (claimError || !claim) return res.status(404).json({ error: "Claim not found" });

    const { data: item, error: itemError } = await userClient
      .from("items")
      .select("*")
      .eq("id", claim.item_id)
      .single();

    if (itemError || !item) return res.status(404).json({ error: "Item not found" });

    // Verify ownership
    if (item.user_id !== user.id) {
      return res.status(403).json({ error: "You are not authorized to manage this claim" });
    }

    const { data: updatedClaim, error: updateError } = await userClient
      .from("claims")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updatedClaim) {
      return res.status(400).json({ error: updateError?.message || "Failed to update claim" });
    }
    
    if (status === "accepted") {
      // Transition item status
      await userClient
        .from("items")
        .update({ status: "claimed" })
        .eq("id", item.id);
      
      // Auto reject pending duplicate claims
      const { data: otherClaims } = await userClient
        .from("claims")
        .select("*")
        .eq("item_id", item.id)
        .neq("id", claim.id)
        .eq("status", "pending");

      if (otherClaims) {
        for (const c of otherClaims) {
          await userClient
            .from("claims")
            .update({ status: "rejected" })
            .eq("id", c.id);
          
          await supabase.from("notifications").insert({
            user_id: c.claimant_id,
            type: "claim_update",
            title: "Claim Update Rejected",
            content: `Your claim for '${item.title}' has been rejected as another claim was accepted.`,
            item_id: item.id,
            is_read: false
          });
        }
      }
    }

    // Notify claimant of status change
    await supabase.from("notifications").insert({
      user_id: claim.claimant_id,
      type: "claim_update",
      title: `Claim Request ${status === "accepted" ? "Approved!" : "Declined"}`,
      content: `The owner has ${status === "accepted" ? "approved" : "declined"} your claim for '${item.title}'.`,
      item_id: item.id,
      is_read: false
    });

    res.json(mapClaimToCamelCase(updatedClaim));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- REPORTS ENDPOINTS ---
app.post("/api/reports", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { claimId, itemId, reason } = req.body;
  if (!claimId || !itemId || !reason) {
    return res.status(400).json({ error: "Missing required fields: claimId, itemId, reason" });
  }

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const newReport = {
      claim_id: claimId,
      item_id: itemId,
      reporter_id: user.id,
      reason
    };

    const { data: insertedReport, error: insertError } = await userClient
      .from("reports")
      .insert(newReport)
      .select()
      .single();

    if (insertError || !insertedReport) {
      return res.status(400).json({ error: insertError?.message || "Failed to submit report" });
    }

    // Notify item poster
    const { data: item } = await supabase
      .from("items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (item) {
      await supabase.from("notifications").insert({
        user_id: item.user_id,
        type: "report",
        title: "Suspicious Claim Flagged",
        content: `Safety Notice: A claim on your valuable "${item.title}" has been reported for: "${reason}". Review carefully!`,
        item_id: itemId,
        is_read: false
      });
    }

    // Alert admins
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("is_admin", true);

    if (admins) {
      for (const admin of admins) {
        await supabase.from("notifications").insert({
          user_id: admin.id,
          type: "report",
          title: "Suspicious Claim Reported",
          content: `A claim matching item #${itemId} was flagged as suspicious. Reason: "${reason}"`,
          item_id: itemId,
          is_read: false
        });
      }
    }

    res.status(201).json(mapReportToCamelCase(insertedReport));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reports", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return res.status(403).json({ error: "Admin privilege required" });
    }

    const { data: reports, error: reportsError } = await userClient
      .from("reports")
      .select("*");

    if (reportsError) {
      return res.status(500).json({ error: reportsError.message });
    }

    res.json((reports || []).map(mapReportToCamelCase));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- MESSAGES / CHAT ENDPOINTS ---
app.get("/api/messages", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: messages, error } = await userClient
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json((messages || []).map(mapMessageToCamelCase));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/messages", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { receiverId, itemId, message } = req.body;
  if (!receiverId || !itemId || !message) {
    return res.status(400).json({ error: "Missing receiverId, itemId, or message content" });
  }

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: senderProf } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!senderProf || senderProf.is_banned) {
      return res.status(403).json({ error: "Action blocked" });
    }

    const newMessage = {
      sender_id: user.id,
      receiver_id: receiverId,
      item_id: itemId,
      message
    };

    const { data: insertedMessage, error: insertError } = await userClient
      .from("messages")
      .insert(newMessage)
      .select()
      .single();

    if (insertError || !insertedMessage) {
      return res.status(400).json({ error: insertError?.message || "Failed to send message" });
    }

    const messagePreview = message.substring(0, 50) + (message.length > 50 ? "..." : "");
    
    // Create notifications for the recipient
    await supabase.from("notifications").insert({
      user_id: receiverId,
      type: "message",
      title: "New Message Received",
      content: `${senderProf.full_name}: "${messagePreview}"`,
      item_id: itemId,
      is_read: false
    });

    res.status(201).json(mapMessageToCamelCase(insertedMessage));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- NOTIFICATIONS ENDPOINTS ---
app.get("/api/notifications", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: notifications, error } = await userClient
      .from("notifications")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json((notifications || []).map(mapNotificationToCamelCase));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/notifications/:id/read", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.params;

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: updatedNotif, error: updateError } = await userClient
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError || !updatedNotif) {
      return res.status(404).json({ error: "Notification not found or access denied" });
    }

    res.json(mapNotificationToCamelCase(updatedNotif));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/notifications/read-all", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { error: updateError } = await userClient
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/notifications", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { error: deleteError } = await userClient
      .from("notifications")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN ACTION ENDPOINTS ---
app.get("/api/admin/users", async (req, res) => {
  const token = getAuthenticatedUserId(req);
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: requester } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!requester || !requester.is_admin) {
      return res.status(403).json({ error: "Admin privilege required" });
    }

    const { data: profiles, error } = await userClient
      .from("profiles")
      .select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json((profiles || []).map(mapProfileToCamelCase));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/admin/users/:userId/status", async (req, res) => {
  const adminId = getAuthenticatedUserId(req);
  if (!adminId) return res.status(401).json({ error: "Unauthorized" });

  const targetUserId = req.params.userId;
  const { isBanned } = req.body;

  try {
    const userClient = getUserSupabaseClient(req);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: adminUser } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!adminUser || !adminUser.is_admin) {
      return res.status(403).json({ error: "Admin privilege required" });
    }

    if (targetUserId === user.id) {
      return res.status(400).json({ error: "You cannot ban yourself" });
    }

    const { data: targetProfile, error: updateError } = await userClient
      .from("profiles")
      .update({ is_banned: !!isBanned })
      .eq("id", targetUserId)
      .select()
      .single();

    if (updateError || !targetProfile) {
      return res.status(404).json({ error: "User not found or failed to update status" });
    }

    res.json(mapProfileToCamelCase(targetProfile));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin dashboard statistics
app.get("/api/stats", async (req, res) => {
  try {
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: activeLostCount } = await supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("type", "lost")
      .eq("status", "lost");

    const { count: activeFoundCount } = await supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("type", "found")
      .eq("status", "found");

    const { count: resolvedCount } = await supabase
      .from("items")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved");

    const { count: totalClaims } = await supabase
      .from("claims")
      .select("*", { count: "exact", head: true });

    res.json({
      usersCount: usersCount || 0,
      activeLostCount: activeLostCount || 0,
      activeFoundCount: activeFoundCount || 0,
      resolvedCount: resolvedCount || 0,
      totalClaims: totalClaims || 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Feed Activity & Safe Zones
app.get("/api/activities", async (req, res) => {
  try {
    const { data: activities, error } = await supabase
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json((activities || []).map(mapActivityToCamelCase));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/safezones", async (req, res) => {
  try {
    const { data: safeZones, error } = await supabase
      .from("safe_zones")
      .select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json((safeZones || []).map(mapSafeZoneToCamelCase));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- INTEGRATE VITE MIDDLEWARE OR STATIC SUB-FLOWS ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LostLink Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
