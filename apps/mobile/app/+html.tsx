import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                height: 100%;
                margin: 0;
                padding: 0;
                background-color: #080C14 !important;
                color: #F8FAFC !important;
                overflow: hidden;
              }
              #root {
                display: flex;
                flex-direction: column;
                height: 100%;
                width: 100%;
                background-color: #080C14 !important;
              }
              #root > div {
                display: flex;
                flex: 1;
                flex-direction: column;
                height: 100%;
                width: 100%;
                background-color: #080C14 !important;
              }
              /* Catch any fallback or transitioning navigator containers */
              div[style*="background-color: rgb(242, 242, 242)"],
              div[style*="background-color: rgba(242, 242, 242"] {
                background-color: #080C14 !important;
              }
            `,
          }}
        />
      </head>
      <body style={{ backgroundColor: "#080C14", margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
