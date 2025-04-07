import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiRequest from "./apiRequest";

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      number: 0,
      notifications: [],
      
      // Fetch notification count from the server
      fetch: async () => {
        try {
          const res = await apiRequest.get("/users/notification");
          set({ number: res.data });
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
        }
      },
      
      // Decrease notification count by 1
      decrease: () => {
        set((state) => ({ 
          number: Math.max(0, state.number - 1) 
        }));
      },
      
      // Reset notification count to 0
      reset: () => {
        set({ number: 0 });
      },
      
      // Add a new notification
      add: (notification) => {
        const { notifications } = get();
        
        // Check if this is a duplicate notification
        const isDuplicate = notifications.some(n => {
          if (n.type === notification.type) {
            // For messages, check if it's from the same sender
            if (n.type === 'message' && n.senderId === notification.senderId) {
              return true;
            }
            // For forum posts, check if it's the same post
            if (n.type === 'forum' && n.postId === notification.postId) {
              return true;
            }
            // For comments, check if it's on the same post
            if (n.type === 'comment' && n.postId === notification.postId) {
              return true;
            }
          }
          return false;
        });
        
        if (!isDuplicate) {
          // Add timestamp to notification
          const newNotification = {
            ...notification,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            read: false
          };
          
          set((state) => ({
            notifications: [newNotification, ...state.notifications.slice(0, 19)], // Keep max 20 notifications
            number: state.number + 1
          }));
        } else {
          // Update the timestamp of existing notification and move it to the top
          set((state) => ({
            notifications: [
              {
                ...notifications.find(n => {
                  if (n.type === notification.type) {
                    if (n.type === 'message' && n.senderId === notification.senderId) return true;
                    if (n.type === 'forum' && n.postId === notification.postId) return true;
                    if (n.type === 'comment' && n.postId === notification.postId) return true;
                  }
                  return false;
                }),
                timestamp: new Date().toISOString(),
                read: false
              },
              ...notifications.filter(n => {
                if (n.type === notification.type) {
                  if (n.type === 'message' && n.senderId === notification.senderId) return false;
                  if (n.type === 'forum' && n.postId === notification.postId) return false;
                  if (n.type === 'comment' && n.postId === notification.postId) return false;
                }
                return true;
              }).slice(0, 19)
            ]
          }));
        }
      },
      
      // Mark a notification as read
      markAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          ),
          number: state.number > 0 ? state.number - 1 : 0
        }));
      },
      
      // Mark all notifications as read
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          number: 0
        }));
      },
      
      // Remove a notification
      remove: (notificationId) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === notificationId);
          return {
            notifications: state.notifications.filter(n => n.id !== notificationId),
            number: notification && !notification.read ? state.number - 1 : state.number
          };
        });
      },
      
      // Clear all notifications
      clear: () => {
        set({ 
          notifications: [],
          number: 0 
        });
      }
    }),
    {
      name: "campus-connect-notifications",
      partialize: (state) => ({ 
        notifications: state.notifications 
      })
    }
  )
);
