'use client';
import { useEffect, useRef } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

let channelCounter = 0;

// Subscribes to Postgres changes on a table via Supabase Realtime, and calls
// onChange whenever a row is inserted/updated/deleted. This is what makes
// "Doctor completes a consult -> Admin sees it live" actually work without
// the Admin needing to manually refresh.
//
// Multiple components can independently subscribe to the same table (e.g.
// the Admin page's notification bell AND the Appointments tab both watch
// "appointments"). Each call gets its own uniquely-named channel — reusing
// the same channel name across independent subscriptions causes Supabase's
// client to throw "cannot add postgres_changes callbacks ... after
// subscribe()", since a channel's listeners must all be attached before
// its single .subscribe() call.
//
// NOTE: Realtime requires the table to be added to the `supabase_realtime`
// publication. By default Supabase enables this for all tables you create
// via the dashboard/SQL editor with default settings, but if updates don't
// arrive live, check Database -> Replication in your Supabase project and
// make sure the relevant tables are toggled on. Polling fallback below
// covers you either way.
export function useRealtimeTable(table, onChange, { pollMs = 15000 } = {}) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    const sb = supabaseBrowser();
    let channel;
    let pollTimer;

    if (sb) {
      const uniqueName = `realtime:${table}:${++channelCounter}`;
      channel = sb
        .channel(uniqueName)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          cbRef.current?.(payload);
        })
        .subscribe();
    }

    // Polling fallback ensures the UI stays fresh even if realtime isn't
    // configured yet, so the app still feels "live enough" out of the box.
    pollTimer = setInterval(() => {
      cbRef.current?.({ type: 'poll' });
    }, pollMs);

    return () => {
      if (channel) sb.removeChannel(channel);
      clearInterval(pollTimer);
    };
  }, [table, pollMs]);
}
