import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/['"]/g, "").trim();
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").replace(/['"]/g, "").trim();

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL ERROR: Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not defined!");
}

// Global anonymous client
const supabase = createClient(supabaseUrl, supabaseKey);

// Dynamic client generator with user JWT for Row Level Security (RLS) enforcement
const getUserSupabaseClient = (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
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

// Helper to extract Authorization token from header
const getAuthenticatedUserId = (req: NextRequest): string | null => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  return token || null;
};

// --- DATABASE TO API RESPONSE MODEL MAPPERS (snake_case -> camelCase) ---
const mapProfileToCamelCase = (p: any) => ({
  id: p.id,
  fullName: p.full_name,
  email: p.email,
  avatarUrl: p.avatar_url,
  createdAt: p.created_at,
  isAdmin: p.is_admin || false,
  isBanned: p.is_banned || false,
  gender: p.gender || undefined
});

const mapItemToCamelCase = (i: any) => ({
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

const mapClaimToCamelCase = (c: any) => ({
  id: c.id,
  itemId: c.item_id,
  claimantId: c.claimant_id,
  verificationAnswer: c.verification_answer,
  status: c.status,
  createdAt: c.created_at,
  isReported: c.is_reported || false
});

const mapMessageToCamelCase = (m: any) => ({
  id: m.id,
  senderId: m.sender_id,
  receiverId: m.receiver_id,
  itemId: m.item_id,
  message: m.message,
  createdAt: m.created_at
});

const mapReportToCamelCase = (r: any) => ({
  id: r.id,
  claimId: r.claim_id,
  itemId: r.item_id,
  reporterId: r.reporter_id,
  reason: r.reason,
  createdAt: r.created_at
});

const mapNotificationToCamelCase = (n: any) => ({
  id: n.id,
  userId: n.user_id,
  type: n.type,
  title: n.title,
  content: n.content,
  isRead: n.is_read,
  itemId: n.item_id,
  createdAt: n.created_at
});

const mapSafeZoneToCamelCase = (s: any) => ({
  id: String(s.id),
  name: s.name,
  description: s.description,
  location: s.location
});

const mapActivityToCamelCase = (a: any) => ({
  id: a.id,
  userId: a.user_id || "Anonymous",
  userName: a.user_name,
  action: a.action,
  targetTitle: a.target_title,
  createdAt: a.created_at
});

// --- HELPER FOR PARSING REQUEST BODY ---
const getRequestBody = async (req: NextRequest) => {
  try {
    return await req.json();
  } catch (e) {
    return {};
  }
};

// --- GET HANDLER ROUTER ---
export async function GET(req: NextRequest, { params }: { params: Promise<{ route?: string[] }> }) {
  const resolvedParams = await params;
  const route = resolvedParams.route || [];
  const path = route.join("/");

  try {
    // 1. /api/auth/me
    if (path === "auth/me") {
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: authError?.message || "Unauthorized" }, { status: 401 });
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }

      if (profile.is_banned) {
        return NextResponse.json({ error: "Your account has been suspended." }, { status: 403 });
      }

      return NextResponse.json(mapProfileToCamelCase(profile));
    }

    // 2. /api/items
    if (path === "items") {
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
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json((items || []).map(mapItemToCamelCase));
    }

    // 3. /api/items/:id/matches
    if (route[0] === "items" && route[2] === "matches" && route.length === 3) {
      const id = route[1];
      const { data: currentItem, error: getError } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();

      if (getError || !currentItem) return NextResponse.json({ error: "Item not found" }, { status: 404 });

      const otherType = currentItem.type === "lost" ? "found" : "lost";

      const { data: otherItems, error: queryError } = await supabase
        .from("items")
        .select("*")
        .eq("type", otherType)
        .neq("id", currentItem.id)
        .neq("status", "resolved");

      if (queryError || !otherItems) {
        return NextResponse.json({ error: queryError?.message || "Failed to fetch items" }, { status: 500 });
      }

      const scoredMatches = otherItems
        .map(item => {
          let score = 0;
          if (item.category.toLowerCase() === currentItem.category.toLowerCase()) {
            score += 50;
          }
          if (item.location.toLowerCase() === currentItem.location.toLowerCase()) {
            score += 30;
          } else if (
            item.location.toLowerCase().includes(currentItem.location.toLowerCase()) || 
            currentItem.location.toLowerCase().includes(item.location.toLowerCase())
          ) {
            score += 15;
          }

          const itemTitleWords = item.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
          const currentTitleWords = currentItem.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
          const commonWords = itemTitleWords.filter((w: string) => currentTitleWords.includes(w));
          
          score += commonWords.length * 10;

          return { item: mapItemToCamelCase(item), score };
        })
        .filter(match => match.score > 0)
        .sort((a, b) => b.score - a.score);

      return NextResponse.json(scoredMatches);
    }

    // 4. /api/items/:id
    if (route[0] === "items" && route.length === 2) {
      const id = route[1];
      const { data: item, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      return NextResponse.json(mapItemToCamelCase(item));
    }

    // 5. /api/claims
    if (path === "claims") {
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const isAdmin = profile?.is_admin || false;
      let claims: any[] = [];

      if (isAdmin) {
        const { data, error } = await userClient.from("claims").select("*");
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        claims = data || [];
      } else {
        const { data: myItems } = await supabase
          .from("items")
          .select("id")
          .eq("user_id", user.id);
        
        const myItemsIds = myItems?.map(i => i.id) || [];

        const { data: myClaims, error: err1 } = await userClient
          .from("claims")
          .select("*")
          .eq("claimant_id", user.id);
        
        if (err1) return NextResponse.json({ error: err1.message }, { status: 500 });

        let itemClaims: any[] = [];
        if (myItemsIds.length > 0) {
          const { data, error: err2 } = await userClient
            .from("claims")
            .select("*")
            .in("item_id", myItemsIds);
          if (err2) return NextResponse.json({ error: err2.message }, { status: 500 });
          itemClaims = data || [];
        }

        const claimMap = new Map();
        (myClaims || []).forEach(c => claimMap.set(c.id, c));
        itemClaims.forEach(c => claimMap.set(c.id, c));
        claims = Array.from(claimMap.values());
      }

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

      return NextResponse.json(mappedClaims);
    }

    // 6. /api/reports
    if (path === "reports") {
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.is_admin) {
        return NextResponse.json({ error: "Admin privilege required" }, { status: 403 });
      }

      const { data: reports, error: reportsError } = await userClient
        .from("reports")
        .select("*");

      if (reportsError) {
        return NextResponse.json({ error: reportsError.message }, { status: 500 });
      }

      return NextResponse.json((reports || []).map(mapReportToCamelCase));
    }

    // 7. /api/messages
    if (path === "messages") {
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: messages, error } = await userClient
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json((messages || []).map(mapMessageToCamelCase));
    }

    // 8. /api/notifications
    if (path === "notifications") {
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: notifications, error } = await userClient
        .from("notifications")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json((notifications || []).map(mapNotificationToCamelCase));
    }

    // 9. /api/admin/users
    if (path === "admin/users") {
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: requester } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!requester || !requester.is_admin) {
        return NextResponse.json({ error: "Admin privilege required" }, { status: 403 });
      }

      const { data: profiles, error } = await userClient
        .from("profiles")
        .select("*");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json((profiles || []).map(mapProfileToCamelCase));
    }

    // 10. /api/stats
    if (path === "stats") {
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

      return NextResponse.json({
        usersCount: usersCount || 0,
        activeLostCount: activeLostCount || 0,
        activeFoundCount: activeFoundCount || 0,
        resolvedCount: resolvedCount || 0,
        totalClaims: totalClaims || 0
      });
    }

    // 11. /api/activities
    if (path === "activities") {
      const { data: activities, error } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json((activities || []).map(mapActivityToCamelCase));
    }

    // 12. /api/safezones
    if (path === "safezones") {
      const { data: safeZones, error } = await supabase
        .from("safe_zones")
        .select("*");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json((safeZones || []).map(mapSafeZoneToCamelCase));
    }

    return NextResponse.json({ error: "API Route Not Found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- POST HANDLER ROUTER ---
export async function POST(req: NextRequest, { params }: { params: Promise<{ route?: string[] }> }) {
  const resolvedParams = await params;
  const route = resolvedParams.route || [];
  const path = route.join("/");
  const body = await getRequestBody(req);

  try {
    // 1. /api/auth/login
    if (path === "auth/login") {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.user) {
        return NextResponse.json({ error: authError?.message || "Invalid email or password" }, { status: 401 });
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: "User profile not found in profiles table." }, { status: 404 });
      }

      if (profile.is_banned) {
        return NextResponse.json({ error: "Your account has been suspended for safety/moderation issues." }, { status: 403 });
      }

      return NextResponse.json({
        user: mapProfileToCamelCase(profile),
        token: authData.session.access_token
      });
    }

    // 2. /api/auth/register
    if (path === "auth/register") {
      const { fullName, email, password, gender } = body;
      if (!fullName || !email || !password) {
        return NextResponse.json({ error: "Full Name, Email and Password are required" }, { status: 400 });
      }

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
        return NextResponse.json({ error: authError?.message || "Registration failed" }, { status: 400 });
      }

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
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
        profile = data;
      }

      if (!authData.session) {
        return NextResponse.json({
          user: mapProfileToCamelCase(profile),
          token: authData.user.id,
          message: "Registration successful. Please verify your email if required."
        }, { status: 201 });
      }

      return NextResponse.json({
        user: mapProfileToCamelCase(profile),
        token: authData.session.access_token
      }, { status: 201 });
    }

    // 3. /api/upload
    if (path === "upload") {
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { base64Data, fileName, contentType } = body;
      if (!base64Data || !fileName || !contentType) {
        return NextResponse.json({ error: "Missing required upload fields (base64Data, fileName, contentType)" }, { status: 400 });
      }

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        return NextResponse.json({ error: uploadError.message }, { status: 400 });
      }

      const { data: { publicUrl } } = supabase
        .storage
        .from("item-images")
        .getPublicUrl(fileName);

      return NextResponse.json({ publicUrl });
    }

    // 4. /api/items
    if (path === "items") {
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile || profile.is_banned) {
        return NextResponse.json({ error: "Action not allowed" }, { status: 403 });
      }

      const { type, title, category, description, location, imageUrl, reward, dateEvent, isAnonymous } = body;
      if (!type || !title || !category || !description || !location || !dateEvent) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
        return NextResponse.json({ error: insertError?.message || "Failed to insert item" }, { status: 400 });
      }

      const actorName = insertedItem.is_anonymous ? "Someone" : profile.full_name;
      await supabase.from("activities").insert({
        user_id: insertedItem.is_anonymous ? null : user.id,
        user_name: actorName,
        action: insertedItem.type === "lost" ? "reported missing" : "reported finding",
        target_title: insertedItem.title
      });

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
          await supabase.from("notifications").insert({
            user_id: matchedItem.user_id,
            type: "item_match",
            title: "Potential Match Found!",
            content: `A new ${insertedItem.type} item: '${insertedItem.title}' matches your item '${matchedItem.title}'. Check it out!`,
            item_id: matchedItem.id,
            is_read: false
          });

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

      return NextResponse.json(mapItemToCamelCase(insertedItem), { status: 201 });
    }

    // 5. /api/claims
    if (path === "claims") {
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { itemId, verificationAnswer } = body;
      if (!itemId || !verificationAnswer) {
        return NextResponse.json({ error: "Missing itemId or verificationAnswer" }, { status: 400 });
      }

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: item, error: itemError } = await supabase
        .from("items")
        .select("*")
        .eq("id", itemId)
        .single();

      if (itemError || !item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

      if (item.user_id === user.id) {
        return NextResponse.json({ error: "You cannot claim your own item" }, { status: 400 });
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
          return NextResponse.json({ error: "You have already submitted a claim for this item." }, { status: 400 });
        }
        return NextResponse.json({ error: errMsg || "Failed to submit claim" }, { status: 400 });
      }

      const { data: claimantUser } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const claimantName = claimantUser?.full_name || "A student";

      await supabase.from("notifications").insert({
        user_id: item.user_id,
        type: "claim",
        title: "New Claim Received",
        content: `${claimantName} claimed your item: '${item.title}'. Answer provided: "${verificationAnswer}"`,
        item_id: item.id,
        is_read: false
      });

      return NextResponse.json(mapClaimToCamelCase(insertedClaim), { status: 201 });
    }

    // 6. /api/reports
    if (path === "reports") {
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { claimId, itemId, reason } = body;
      if (!claimId || !itemId || !reason) {
        return NextResponse.json({ error: "Missing required fields: claimId, itemId, reason" }, { status: 400 });
      }

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        return NextResponse.json({ error: insertError?.message || "Failed to submit report" }, { status: 400 });
      }

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

      return NextResponse.json(mapReportToCamelCase(insertedReport), { status: 201 });
    }

    // 7. /api/messages
    if (path === "messages") {
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { receiverId, itemId, message } = body;
      if (!receiverId || !itemId || !message) {
        return NextResponse.json({ error: "Missing receiverId, itemId, or message content" }, { status: 400 });
      }

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: senderProf } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!senderProf || senderProf.is_banned) {
        return NextResponse.json({ error: "Action blocked" }, { status: 403 });
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
        return NextResponse.json({ error: insertError?.message || "Failed to send message" }, { status: 400 });
      }

      const messagePreview = message.substring(0, 50) + (message.length > 50 ? "..." : "");
      
      await supabase.from("notifications").insert({
        user_id: receiverId,
        type: "message",
        title: "New Message Received",
        content: `${senderProf.full_name}: "${messagePreview}"`,
        item_id: itemId,
        is_read: false
      });

      return NextResponse.json(mapMessageToCamelCase(insertedMessage), { status: 201 });
    }

    // 8. /api/notifications/read-all
    if (path === "notifications/read-all") {
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { error: updateError } = await userClient
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "API Route Not Found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- PUT HANDLER ROUTER ---
export async function PUT(req: NextRequest, { params }: { params: Promise<{ route?: string[] }> }) {
  const resolvedParams = await params;
  const route = resolvedParams.route || [];
  const path = route.join("/");
  const body = await getRequestBody(req);

  try {
    // 1. /api/profile
    if (path === "profile") {
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { gender, avatarUrl } = body;
      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        return NextResponse.json({ error: profileError?.message || "Failed to update profile" }, { status: 400 });
      }

      return NextResponse.json(mapProfileToCamelCase(updatedProfile));
    }

    return NextResponse.json({ error: "API Route Not Found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- PATCH HANDLER ROUTER ---
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ route?: string[] }> }) {
  const resolvedParams = await params;
  const route = resolvedParams.route || [];
  const path = route.join("/");
  const body = await getRequestBody(req);

  try {
    // 1. /api/items/:id
    if (route[0] === "items" && route.length === 2) {
      const id = route[1];
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { status, title, description, reward, location, dateEvent, category, imageUrl } = body;
      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: existingItem, error: getError } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();

      if (getError || !existingItem) return NextResponse.json({ error: "Item not found" }, { status: 404 });

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const isAdmin = profile?.is_admin || false;
      if (existingItem.user_id !== user.id && !isAdmin) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
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
        return NextResponse.json({ error: updateError?.message || "Failed to update item" }, { status: 400 });
      }

      return NextResponse.json(mapItemToCamelCase(updatedItem));
    }

    // 2. /api/claims/:id
    if (route[0] === "claims" && route.length === 2) {
      const id = route[1];
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { status } = body;
      if (!status || !["accepted", "rejected"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: claim, error: claimError } = await userClient
        .from("claims")
        .select("*")
        .eq("id", id)
        .single();

      if (claimError || !claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

      const { data: item, error: itemError } = await userClient
        .from("items")
        .select("*")
        .eq("id", claim.item_id)
        .single();

      if (itemError || !item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

      if (item.user_id !== user.id) {
        return NextResponse.json({ error: "You are not authorized to manage this claim" }, { status: 403 });
      }

      const { data: updatedClaim, error: updateError } = await userClient
        .from("claims")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (updateError || !updatedClaim) {
        return NextResponse.json({ error: updateError?.message || "Failed to update claim" }, { status: 400 });
      }
      
      if (status === "accepted") {
        await userClient
          .from("items")
          .update({ status: "claimed" })
          .eq("id", item.id);
        
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

      await supabase.from("notifications").insert({
        user_id: claim.claimant_id,
        type: "claim_update",
        title: `Claim Request ${status === "accepted" ? "Approved!" : "Declined"}`,
        content: `The owner has ${status === "accepted" ? "approved" : "declined"} your claim for '${item.title}'.`,
        item_id: item.id,
        is_read: false
      });

      return NextResponse.json(mapClaimToCamelCase(updatedClaim));
    }

    // 3. /api/notifications/:id/read
    if (route[0] === "notifications" && route[2] === "read" && route.length === 3) {
      const id = route[1];
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: updatedNotif, error: updateError } = await userClient
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError || !updatedNotif) {
        return NextResponse.json({ error: "Notification not found or access denied" }, { status: 404 });
      }

      return NextResponse.json(mapNotificationToCamelCase(updatedNotif));
    }

    // 4. /api/admin/users/:userId/status
    if (route[0] === "admin" && route[1] === "users" && route[3] === "status" && route.length === 4) {
      const targetUserId = route[2];
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { isBanned } = body;
      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: adminUser } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!adminUser || !adminUser.is_admin) {
        return NextResponse.json({ error: "Admin privilege required" }, { status: 403 });
      }

      if (targetUserId === user.id) {
        return NextResponse.json({ error: "You cannot ban yourself" }, { status: 400 });
      }

      const { data: targetProfile, error: updateError } = await userClient
        .from("profiles")
        .update({ is_banned: !!isBanned })
        .eq("id", targetUserId)
        .select()
        .single();

      if (updateError || !targetProfile) {
        return NextResponse.json({ error: "User not found or failed to update status" }, { status: 404 });
      }

      return NextResponse.json(mapProfileToCamelCase(targetProfile));
    }

    return NextResponse.json({ error: "API Route Not Found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// --- DELETE HANDLER ROUTER ---
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ route?: string[] }> }) {
  const resolvedParams = await params;
  const route = resolvedParams.route || [];
  const path = route.join("/");

  try {
    // 1. /api/items/:id
    if (route[0] === "items" && route.length === 2) {
      const id = route[1];
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { data: existingItem, error: getError } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();

      if (getError || !existingItem) return NextResponse.json({ error: "Item not found" }, { status: 404 });

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const isAdmin = profile?.is_admin || false;
      if (existingItem.user_id !== user.id && !isAdmin) {
        return NextResponse.json({ error: "Permission denied" }, { status: 403 });
      }

      const { error: deleteError } = await userClient
        .from("items")
        .delete()
        .eq("id", id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "Item successfully deleted" });
    }

    // 2. /api/notifications
    if (path === "notifications") {
      const token = getAuthenticatedUserId(req);
      if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const userClient = getUserSupabaseClient(req);
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const { error: deleteError } = await userClient
        .from("notifications")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "API Route Not Found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
