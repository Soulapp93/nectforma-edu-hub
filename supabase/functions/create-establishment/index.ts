import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { establishment, admin } = await req.json();

    console.log('Creating establishment:', establishment.name);
    console.log('Creating admin:', admin.email);

    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // 1. Create establishment
    const { data: establishmentData, error: establishmentError } = await supabaseAdmin
      .from('establishments')
      .insert({
        name: establishment.name,
        type: establishment.type,
        email: establishment.email,
        address: establishment.address || null,
        phone: establishment.phone || null,
        website: establishment.website || null,
        siret: establishment.siret || null,
        director: establishment.director || null,
        number_of_students: establishment.numberOfStudents || null,
        number_of_instructors: establishment.numberOfInstructors || null
      })
      .select()
      .single();

    if (establishmentError) {
      console.error('Establishment creation error:', establishmentError);
      throw new Error(`Erreur création établissement: ${establishmentError.message}`);
    }

    console.log('Establishment created with ID:', establishmentData.id);

    // 2. Check if auth user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(u => u.email === admin.email);

    let authUserId: string;

    if (existingAuthUser) {
      console.log('Auth user already exists, reusing:', existingAuthUser.id);
      authUserId = existingAuthUser.id;
      
      // Update user metadata
      await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
        password: admin.password,
        user_metadata: {
          first_name: admin.firstName,
          last_name: admin.lastName,
          phone: admin.phone,
          establishment_id: establishmentData.id
        }
      });
    } else {
      // Create new auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: {
          first_name: admin.firstName,
          last_name: admin.lastName,
          phone: admin.phone,
          establishment_id: establishmentData.id
        }
      });

      if (authError) {
        console.error('Auth user creation error:', authError);
        await supabaseAdmin.from('establishments').delete().eq('id', establishmentData.id);
        throw new Error(`Erreur création utilisateur: ${authError.message}`);
      }
      
      authUserId = authData.user.id;
    }

    console.log('Auth user ID:', authUserId);

    // 3. Check if user profile was already created by trigger
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', authUserId)
      .maybeSingle();

    if (existingUser) {
      console.log('User profile already exists (created by trigger), updating...');
      // Update the existing profile with correct data
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          first_name: admin.firstName,
          last_name: admin.lastName,
          email: admin.email,
          phone: admin.phone || null,
          role: 'Admin',
          establishment_id: establishmentData.id,
          status: 'Actif',
          is_activated: true
        })
        .eq('id', authUserId);

      if (updateError) {
        console.error('User profile update error:', updateError);
      }
    } else {
      console.log('Creating user profile...');
      // Create user profile if not created by trigger
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUserId,
          first_name: admin.firstName,
          last_name: admin.lastName,
          email: admin.email,
          phone: admin.phone || null,
          role: 'Admin',
          establishment_id: establishmentData.id,
          status: 'Actif',
          is_activated: true
        });

      if (userError) {
        console.error('User profile creation error:', userError);
        // Rollback: delete auth user and establishment
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        await supabaseAdmin.from('establishments').delete().eq('id', establishmentData.id);
        throw new Error(`Erreur création profil: ${userError.message}`);
      }
    }

    console.log('User profile ready');

    return new Response(
      JSON.stringify({
        success: true,
        establishmentId: establishmentData.id,
        userId: authUserId,
        message: 'Compte établissement créé avec succès'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in create-establishment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Une erreur est survenue'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
