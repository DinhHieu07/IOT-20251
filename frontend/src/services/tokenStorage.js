/**
 * Token Storage - Lưu accessToken trong memory thay vì localStorage
 * Để bảo mật hơn, tránh XSS attacks
 */

let accessToken = null;

export const tokenStorage = {
  set: (token) => {
    accessToken = token;
  },

  get: () => {
    return accessToken;
  },

  remove: () => {
    accessToken = null;
  },
};

