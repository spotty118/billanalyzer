
// TODO: Implement proper Supabase client configuration
export const supabase = {
  from: () => ({
    select: () => Promise.resolve([]),
    insert: () => Promise.resolve([]),
    update: () => Promise.resolve([]),
    delete: () => Promise.resolve([]),
  }),
};
