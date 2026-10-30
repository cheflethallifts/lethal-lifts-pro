const QUEUE_KEY = 'lethal_offline_queue';

const readQueue = () => {
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    return Array.isArray(queue) ? queue : [];
  } catch (e) {
    return [];
  }
};

const writeQueue = (queue) => {
  if (queue.length === 0) {
    localStorage.removeItem(QUEUE_KEY);
  } else {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
};

// Sessions queued before userId was stored still carry it on their records.
const queueOwner = (session) => session.userId ?? session.records?.[0]?.user_id;

// Returns false if the device couldn't store it, so the caller can keep the workout on screen.
export const enqueueSession = (session) => {
  try {
    writeQueue([...readQueue(), session]);
    return true;
  } catch (e) {
    return false;
  }
};

// Drops one entry at a time, re-reading the queue so a workout saved mid-sync isn't overwritten.
const removeFromQueue = (sessionId) => {
  const queue = readQueue();
  const index = queue.findIndex(session => session.id === sessionId);
  if (index > -1) {
    queue.splice(index, 1);
    writeQueue(queue);
  }
};

// Each session replaces whatever is stored under its timestamp, so retrying one that
// did reach the server (but whose reply was lost) can't create a duplicate.
export const syncQueuedSessions = async (supabaseClient, userId) => {
  const results = { synced: 0, failed: 0 };
  // Skips later edits of a failed session, so an older copy can't overwrite a newer one on retry.
  const failedIds = new Set();

  const sessions = readQueue().filter(session => {
    const owner = queueOwner(session);
    return !owner || owner === userId;
  });

  for (const session of sessions) {
    if (failedIds.has(session.id)) {
      results.failed += 1;
      continue;
    }

    try {
      const { error: deleteError } = await supabaseClient.from('workout_logs')
        .delete()
        .eq('session_timestamp', session.id)
        .eq('user_id', userId);
      if (deleteError) throw deleteError;

      if (session.records && session.records.length > 0) {
        const { error: insertError } = await supabaseClient.from('workout_logs').insert(session.records);
        if (insertError) throw insertError;
      }

      removeFromQueue(session.id);
      results.synced += 1;
    } catch (e) {
      console.error("Failed to sync offline session:", e);
      failedIds.add(session.id);
      results.failed += 1;
    }
  }

  return results;
};
