// Temporary mock supabase client (UI only mode)

export const supabase = {
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: () => ({ error: null }),
    delete: () => ({ error: null }),
    order: () => ({ data: [], error: null }),
    eq: () => ({ error: null })
  })
};
