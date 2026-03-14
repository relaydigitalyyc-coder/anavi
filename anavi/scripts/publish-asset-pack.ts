import { publishAnimationStudioAssetPack } from "../server/db/animationStudio";

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: pnpm tsx scripts/publish-asset-pack.ts <packId> [channels...]

Arguments:
  packId      The ID of the asset pack to publish.
  channels    List of channels to publish to (e.g. youtube linkedin x).
              Defaults to: youtube linkedin x

Example:
  pnpm tsx scripts/publish-asset-pack.ts my-asset-pack-id youtube linkedin
`);
    process.exit(0);
  }

  const packId = args[0];
  const possibleChannels = ["youtube", "linkedin", "x"] as const;
  type Channel = typeof possibleChannels[number];

  const rawChannels = args.slice(1);
  const channels: Channel[] = rawChannels.length > 0 
    ? (rawChannels.filter(c => possibleChannels.includes(c as any)) as Channel[])
    : ["youtube", "linkedin", "x"];

  if (channels.length === 0) {
    console.error("Error: No valid channels provided. Valid channels are: youtube, linkedin, x");
    process.exit(1);
  }

  console.log(`Publishing asset pack: ${packId}`);
  console.log(`Channels: ${channels.join(", ")}`);
  
  try {
    const result = await publishAnimationStudioAssetPack({
      packId,
      channels,
    });

    if (result.success) {
      console.log("\n✅ Publish successful!");
    } else {
      console.error("\n❌ Publish completed with errors.");
    }

    console.log("\nPublished to:");
    for (const pub of result.publishedTo) {
      console.log(`  - ${pub.channel}: ${pub.url}`);
    }

    if (result.errors && result.errors.length > 0) {
      console.error("\nErrors:");
      for (const err of result.errors) {
        console.error(`  - ${err}`);
      }
      process.exitCode = 1;
    }
  } catch (error: any) {
    console.error(`\n❌ Failed to publish asset pack:`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
