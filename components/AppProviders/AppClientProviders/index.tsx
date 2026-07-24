// https://mui.com/material-ui/integrations/nextjs/

"use client";

import { closeSnackbar, SnackbarProvider } from "notistack";
import { Suspense } from "react";
import { SWRConfiguration } from "swr";

import LocaleProvider from "@/components/LocaleProvider";
import OAuthSnackbar from "@/components/OAuthSnackbar";

import { Close } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

import { AuthStoreProvider } from "@/providers/auth-store-provider";
import { CartStoreProvider } from "@/providers/cart-store-provider";
import { CountdownStoreProvider } from "@/providers/countdown-store-provider";
import { DialogStoreProvider } from "@/providers/dialog-store-provider";
import { DrawerStoreProvider } from "@/providers/drawer-store-provider";
import { OrderSearchStoreProvider } from "@/providers/order-search-store-provider";
import SWRProvider from "@/providers/SWRProvider";
import { UploadAvatarStoreProvider } from "@/providers/upload-avatar-store-provider";
import { ViewStoreProvider } from "@/providers/view-store-provider";

import type { Session } from "@/types/auth";

interface AppClientProvidersProps {
  children: React.ReactNode;
  fallback: SWRConfiguration["fallback"];
  initialSession: Session | null;
}

const AppClientProviders = ({
  children,
  fallback,
  initialSession,
}: AppClientProvidersProps) => (
  <AppRouterCacheProvider options={{ enableCssLayer: true }}>
    <LocaleProvider>
      <SnackbarProvider
        action={(snackbarId) => (
          <IconButton
            aria-label="close"
            color="inherit"
            onClick={() => closeSnackbar(snackbarId)}
            size="small"
          >
            <Close fontSize="small" />
          </IconButton>
        )}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={3000}
        classes={{
          containerAnchorOriginTopRight: "notistack-container-top-right-offset",
        }}
        maxSnack={3}
      >
        <Suspense>
          <OAuthSnackbar />
        </Suspense>
        <SWRProvider fallback={fallback}>
          <AuthStoreProvider initialSession={initialSession}>
            <CartStoreProvider>
              <CountdownStoreProvider>
                <DialogStoreProvider>
                  <DrawerStoreProvider>
                    <OrderSearchStoreProvider>
                      <UploadAvatarStoreProvider>
                        <ViewStoreProvider>{children}</ViewStoreProvider>
                      </UploadAvatarStoreProvider>
                    </OrderSearchStoreProvider>
                  </DrawerStoreProvider>
                </DialogStoreProvider>
              </CountdownStoreProvider>
            </CartStoreProvider>
          </AuthStoreProvider>
        </SWRProvider>
      </SnackbarProvider>
    </LocaleProvider>
  </AppRouterCacheProvider>
);

export default AppClientProviders;
