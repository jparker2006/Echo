"use client";

/* Central GSAP entry point. Registers the plugins exactly once (importing
   this module is idempotent — registerPlugin de-dupes) and re-exports the
   pieces every motion component needs. Marked "use client" so registration
   only ever runs in the browser, never during SSR. */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export { gsap, ScrollTrigger, useGSAP };
