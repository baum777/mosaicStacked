type PwaRegistrationEnvironment = {
  isDev: boolean;
  isSecureContext: boolean;
  hasServiceWorker: boolean;
};

const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const CONTROLLER_RELOAD_GUARD_KEY = "mosaicstacked:sw-controller-reload-at";
const CONTROLLER_RELOAD_GUARD_WINDOW_MS = 10_000;

export function shouldRegisterPwa(environment: PwaRegistrationEnvironment) {
  return !environment.isDev
    && environment.isSecureContext
    && environment.hasServiceWorker;
}

async function clearDevelopmentPwaState() {
  const serviceWorker = typeof navigator !== "undefined" ? navigator.serviceWorker : undefined;

  if (serviceWorker && "getRegistrations" in serviceWorker) {
    const registrations = await serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if (typeof caches !== "undefined") {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }
}

export function shouldReloadOnControllerChange(nowMs: number, sessionStorageLike: Storage | null) {
  if (!sessionStorageLike) {
    return false;
  }

  try {
    const raw = sessionStorageLike.getItem(CONTROLLER_RELOAD_GUARD_KEY);

    if (raw !== null) {
      const previous = Number.parseInt(raw, 10);

      if (Number.isFinite(previous) && nowMs - previous < CONTROLLER_RELOAD_GUARD_WINDOW_MS) {
        return false;
      }
    }

    sessionStorageLike.setItem(CONTROLLER_RELOAD_GUARD_KEY, String(nowMs));
    return true;
  } catch {
    return false;
  }
}

type ServiceWorkerRegistrationLike = {
  update: () => Promise<unknown>;
};

function attachPwaUpdateFlow(
  registration: ServiceWorkerRegistrationLike,
  serviceWorker: ServiceWorkerContainer,
  windowLike: Window
) {
  let sessionStorageRef: Storage | null = null;

  try {
    sessionStorageRef = windowLike.sessionStorage;
  } catch {
    sessionStorageRef = null;
  }

  serviceWorker.addEventListener("controllerchange", () => {
    // A new service worker took control: the running app was built for the
    // previous chunk set. Reload once (guarded) to adopt the fresh shell.
    if (shouldReloadOnControllerChange(Date.now(), sessionStorageRef)) {
      windowLike.location.reload();
    }
  });

  const checkForUpdates = () => {
    registration.update().catch(() => {
      // Offline or transient failures must not surface to the user.
    });
  };

  windowLike.setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL_MS);
  windowLike.document.addEventListener("visibilitychange", () => {
    if (windowLike.document.visibilityState === "visible") {
      checkForUpdates();
    }
  });
}

export async function registerPwa() {
  const environment = {
    isDev: import.meta.env.DEV,
    isSecureContext: typeof window !== "undefined" && window.isSecureContext,
    hasServiceWorker: typeof navigator !== "undefined" && "serviceWorker" in navigator,
  };

  if (!shouldRegisterPwa(environment)) {
    if (environment.isDev && environment.hasServiceWorker) {
      try {
        await clearDevelopmentPwaState();
      } catch (error) {
        console.warn("PWA development cleanup failed", error);
      }
    }
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

    if (typeof window !== "undefined") {
      attachPwaUpdateFlow(registration, navigator.serviceWorker, window);
    }

    return true;
  } catch (error) {
    console.warn("PWA service worker registration failed", error);
    return false;
  }
}
