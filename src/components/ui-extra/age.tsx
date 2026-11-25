"use client";

import { useSyncExternalStore } from "react";
import { ageFrom } from "@/lib/format";

const subscribe = () => () => {};

/**
 * " (age 54)" for living people. Computed in the browser so cached pages never show a stale age;
 * renders nothing during prerender.
 */
export function Age({ birthday, deathday }: { birthday: string; deathday?: string | null }) {
  const age = useSyncExternalStore(
    subscribe,
    () => ageFrom(birthday, deathday),
    () => null,
  );
  if (age === null) return null;
  return (
    <>
      {" "}
      ({deathday ? "aged" : "age"} {age})
    </>
  );
}
