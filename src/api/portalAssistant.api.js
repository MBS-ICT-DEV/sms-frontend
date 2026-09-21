import apiClient from './axios';

/*
  MBS Portal Assistant — backed by the school AI endpoint.

  Backend route (sms-backend):
    router.post("/ai/chat", protect, authorizeRoles(...ALL_PORTAL_ROLES), chatWithAI)
  mounted under /admin, so the full path is /admin/ai/chat.

  The frontend is only a client here: it forwards the user's message and
  renders the answer. Authorization and data access are owned entirely by the
  backend, which scopes every answer to the caller's role via req.user.
*/
export const portalAssistantAPI = {
  /**
   * Send a message to the portal assistant.
   *
   * @param {object} payload
   * @param {string} payload.message - The user's message.
   */
  chat: ({ message } = {}) =>
    apiClient.post(
      '/admin/ai/chat',
      { message },
      {
        // The assistant renders its own inline error states; skip the global
        // interceptor toast so the user is not notified twice.
        skipErrorToast: true,
        timeout: 30000,
      },
    ),
};

export default portalAssistantAPI;