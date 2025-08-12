import { Request, Response } from "express";
import run from "../../scripts/enrich-acs.js";

export async function enrichSites(req: Request, res: Response) {
  try {
    console.log("Starting ACS enrichment process...");
    await run();
    res.json({ ok: true, message: "ACS enrichment completed successfully" });
  } catch (error: any) {
    console.error("ACS enrichment error:", error);
    res.status(500).json({ 
      ok: false, 
      error: error.message,
      message: "ACS enrichment failed"
    });
  }
}