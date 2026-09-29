import { supabase } from './supabase';
import { Assignment, RecordEntry, User } from './storage';
export async function loadCloud(user: User) {
  if (!supabase) return null;
  const [a,r] = await Promise.all([
    supabase.from('assignments').select('data'),
    supabase.from('experiment_results').select('data')
  ]);
  if (a.error || r.error) throw a.error || r.error;
  return { assignments:(a.data||[]).map(x=>x.data as Assignment), records:(r.data||[]).map(x=>x.data as RecordEntry) };
}
export async function saveCloudAssignment(a: Assignment) {
  if (!supabase) return;
  const {data:{user}}=await supabase.auth.getUser();
  if (!user) throw new Error('Sign in to share assignments.');
  const {error}=await supabase.from('assignments').insert({id:a.id,teacher_id:user.id,class_name:a.className,data:a});
  if (error) throw error;
}
export async function saveCloudResult(r: RecordEntry, user: User) {
  if (!supabase) return;
  const {data:{user:sessionUser}}=await supabase.auth.getUser();
  if (!sessionUser) throw new Error('Sign in to save results.');
  const {error}=await supabase.from('experiment_results').upsert({student_id:sessionUser.id,experiment_id:r.experimentId,class_name:user.className||'Science class',data:r},{onConflict:'student_id,experiment_id'});
  if (error) throw error;
}
