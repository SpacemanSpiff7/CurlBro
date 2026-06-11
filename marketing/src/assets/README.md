Source: ~/Documents/GitHub/curlbro-app/
Copied on: 2026-04-25
CI/CD does NOT pull from the iOS repo. To update, re-copy and commit.

Hero logo burst frames:
- Source: ~/Documents/GitHub/curlbro-app/Packages/CurlBroKit/Sources/DesignSystem/Resources/
- Static rest frame: Images.xcassets/logo.imageset/logo@3x.png
- Flex frames: IconBurstFrames.xcassets/brand_logo_flex_frame_0*.imageset/*@3x.png
- Marketing destination: marketing/public/logo-burst/
- Runtime: marketing/src/scripts/animations.ts swaps those PNG frames for hover/click/focus and occasional idle replay.
