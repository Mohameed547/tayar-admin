let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

const processQueue = (error: any, token?: string) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  const token = localStorage.getItem("token");
  
  let headers: Headers;
  if (init && init.headers) {
    headers = new Headers(init.headers);
  } else {
    headers = new Headers();
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const newInit = { ...init, headers };

  let response = await originalFetch(input, newInit);

  if (response.status === 401) {
    const urlStr = typeof input === "string" ? input : (input as any).url || "";
    const isLoginRequest = urlStr.includes("/auth/login") || urlStr.includes("/auth/admin/login");
    const isRefreshRequest = urlStr.includes("/auth/refresh-token");

    if (!isLoginRequest && !isRefreshRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken) => {
              const retryHeaders = new Headers(newInit.headers);
              retryHeaders.set("Authorization", `Bearer ${newToken}`);
              resolve(originalFetch(input, { ...newInit, headers: retryHeaders }));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await originalFetch(`${import.meta.env.VITE_BASE_URL}/auth/refresh-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!refreshRes.ok) {
          throw new Error("Refresh failed");
        }

        const data = await refreshRes.json();
        const newAccessToken = data.data.tokens.accessToken;

        localStorage.setItem("token", newAccessToken);
        processQueue(null, newAccessToken);

        const retryHeaders = new Headers(newInit.headers);
        retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
        return originalFetch(input, { ...newInit, headers: retryHeaders });
      } catch (err) {
        processQueue(err);
        localStorage.removeItem("token");
        localStorage.removeItem("admin");
        window.dispatchEvent(new CustomEvent("auth-logout"));
        throw err;
      } finally {
        isRefreshing = false;
      }
    }
  }

  return response;
};

export {};
