import { supabase } from './supabase';

export interface ChatMessage {
    id: string;
    created_at: string;
    room_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
}

export interface ChatRoom {
    id: string;
    student_id: string;
    coach_id: string;
    last_message: string | null;
    last_message_at: string;
}

export const chatService = {
    /**
     * Finds an existing chat room between a student and coach or creates a new one.
     */
    async getOrCreateRoom(senderId: string, recipientId: string): Promise<string> {
        // Enforce alphabetical sorting for consistent matching regardless of who initiates
        const u1 = senderId < recipientId ? senderId : recipientId;
        const u2 = senderId > recipientId ? senderId : recipientId;

        // Try to find existing room by ANY combination of sender/recipient
        const { data: existing, error: findError } = await supabase
            .from('chat_rooms')
            .select('id')
            .or(`and(student_id.eq.${senderId},coach_id.eq.${recipientId}),and(student_id.eq.${recipientId},coach_id.eq.${senderId}),and(student_id.eq.${u1},coach_id.eq.${u2})`)
            .maybeSingle();

        if (existing) return existing.id;

        // Create new if not found (u1 becomes student_id, u2 becomes coach_id consistently)
        const { data: created, error: createError } = await supabase
            .from('chat_rooms')
            .insert({ student_id: u1, coach_id: u2 })
            .select('id')
            .single();

        if (createError) throw createError;
        return created.id;
    },

    /**
     * Fetches message history for a room.
     */
    async getMessages(roomId: string): Promise<ChatMessage[]> {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as ChatMessage[];
    },

    /**
     * Sends a new message and updates the room's last_message metadata.
     */
    async sendMessage(roomId: string, senderId: string, content: string) {
        // 1. Insert message
        const { error: msgError } = await supabase
            .from('messages')
            .insert({
                room_id: roomId,
                sender_id: senderId,
                content: content
            });

        if (msgError) throw msgError;

        // 2. Update room metadata (for sorting chat lists)
        await supabase
            .from('chat_rooms')
            .update({
                last_message: content,
                last_message_at: new Date().toISOString()
            })
            .eq('id', roomId);
    },

    /**
     * Subscribes to real-time message updates for a specific room.
     */
    subscribeToMessages(roomId: string, onMessage: (msg: ChatMessage) => void) {
        return supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `room_id=eq.${roomId}`
                },
                (payload) => {
                    onMessage(payload.new as ChatMessage);
                }
            )
            .subscribe();
    },

    /**
     * Fetches all chat rooms for a user (either student or coach).
     */
    async getUserRooms(userId: string): Promise<any[]> {
        const { data: rooms, error } = await supabase
            .from('chat_rooms')
            .select(`
                *,
                student:profiles!chat_rooms_student_id_fkey(id, name, photo_url),
                coach:profiles!chat_rooms_coach_id_fkey(id, name, photo_url)
            `)
            .or(`student_id.eq.${userId},coach_id.eq.${userId}`)
            .order('last_message_at', { ascending: false });

        if (error) throw error;
        if (!rooms || rooms.length === 0) return [];

        // Find which counterpart is a coach
        const counterpartIds = rooms.map(r => r.student_id === userId ? r.coach_id : r.student_id);
        const { data: coaches } = await supabase
            .from('coach_profiles')
            .select('user_id')
            .in('user_id', counterpartIds);

        const coachIdSet = new Set(coaches?.map(c => c.user_id) || []);

        return rooms.map(r => {
            const counterpartId = r.student_id === userId ? r.coach_id : r.student_id;
            return {
                ...r,
                is_counterpart_coach: coachIdSet.has(counterpartId)
            };
        });
    }
};
