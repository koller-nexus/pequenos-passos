import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("declares installability and safe icon sizes", () => {
    const routeManifest = manifest();

    expect(routeManifest).toMatchObject({
      name: "Pequenos Passos",
      short_name: "Pequenos Passos",
      start_url: "/",
      scope: "/",
      display: "standalone",
    });
    expect(routeManifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192", type: "image/png" }),
        expect.objectContaining({ sizes: "512x512", type: "image/png" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
      ]),
    );
  });
});
