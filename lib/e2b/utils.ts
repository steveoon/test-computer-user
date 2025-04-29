"use server";

import { Sandbox } from "@e2b/desktop";
import { resolution } from "./tool";

export const getDesktop = async (id?: string) => {
  try {
    if (id) {
      const connected = await Sandbox.connect(id);
      const isRunning = await connected.isRunning();
      if (isRunning) {
        // await connected.stream.start();
        return connected;
      }
    }

    const desktop = await Sandbox.create({
      resolution: [resolution.x, resolution.y], // Custom resolution
      timeoutMs: 300000, // Container timeout in milliseconds
    });
    await desktop.stream.start();
    return desktop;
  } catch (error) {
    console.error("Error in getDesktop:", error);
    throw error;
  }
};

export const getDesktopURL = async (id?: string) => {
  try {
    const desktop = await getDesktop(id);
    const streamUrl = desktop.stream.getUrl();

    return { streamUrl, id: desktop.sandboxId };
  } catch (error) {
    console.error("Error in getDesktopURL:", error);
    throw error;
  }
};

export const killDesktop = async (id: string = "desktop") => {
  const desktop = await getDesktop(id);
  await desktop.kill();
};
