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

    // 1. Create establishment first
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

    // 2. Try to create auth user - if exists, we'll handle it
    let authUserId: string;
    
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
      console.log('Auth creation error:', authError.message);
      
      // If user already exists, try to find and update them
      if (authError.message.includes('already') || authError.message.includes('registered')) {
        console.log('User already exists, searching for them...');
        
        // Search through paginated results
        let foundUser = null;
        let page = 1;
        const perPage = 1000;
        
        while (!foundUser) {
          const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            page: page,
            perPage: perPage
          });
          
          if (listError) {
            console.error('Error listing users:', listError);
            break;
          }
          
          foundUser = usersData.users.find(u => u.email === admin.email);
          
          if (foundUser || usersData.users.length < perPage) {
            break;
          }
          page++;
        }
        
        if (foundUser) {
          console.log('Found existing user:', foundUser.id);
          authUserId = foundUser.id;
          
          // Update the existing user with new password and metadata
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(foundUser.id, {
            password: admin.password,
            user_metadata: {
              first_name: admin.firstName,
              last_name: admin.lastName,
              phone: admin.phone,
              establishment_id: establishmentData.id
            }
          });
          
          if (updateError) {
            console.error('Error updating user:', updateError);
          }
        } else {
          // User not found - delete establishment and throw error
          console.error('Could not find existing user');
          await supabaseAdmin.from('establishments').delete().eq('id', establishmentData.id);
          throw new Error(`L'email ${admin.email} est déjà utilisé mais impossible de récupérer le compte. Veuillez utiliser un autre email.`);
        }
      } else {
        // Other error - rollback establishment creation
        await supabaseAdmin.from('establishments').delete().eq('id', establishmentData.id);
        throw new Error(`Erreur création utilisateur: ${authError.message}`);
      }
    } else {
      authUserId = authData.user.id;
      console.log('New auth user created with ID:', authUserId);
    }

    // 3. Check if user profile exists (may have been created by trigger)
    const { data: existingProfile } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', authUserId)
      .maybeSingle();

    if (existingProfile) {
      console.log('User profile exists, updating...');
      // Update existing profile with correct data
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
      // Create new user profile
      const { error: profileError } = await supabaseAdmin
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

      if (profileError) {
        console.error('User profile creation error:', profileError);
        // Don't delete auth user if profile creation fails (trigger might create it later)
        // Just log the error
      }
    }

    console.log('Account creation completed successfully');

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
