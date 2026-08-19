// 云端数据库 API 操作（完全不修改表结构与解密逻辑）
async function fetchItemsFromDB() {
  const { data, error } = await _supabase
    .from('prompts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Fetch Error:", error);
    return [];
  }
  return data || [];
}

async function saveItemToDB(dataRow, id = null) {
  if (id) {
    return await _supabase.from('prompts').update(dataRow).eq('id', id);
  } else {
    return await _supabase.from('prompts').insert([dataRow]);
  }
}

async function batchSaveItemsToDB(rows) {
  return await _supabase.from('prompts').insert(rows);
}

async function deleteItemFromDB(id) {
  return await _supabase.from('prompts').delete().eq('id', id);
}
