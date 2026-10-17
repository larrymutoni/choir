"use client";

import {
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type Options = {
  storageKey: string;
  columnCount: number;
  minWidth?: number;
};

export function useResizableColumns({
  storageKey,
  columnCount,
  minWidth = 80,
}: Options) {
  /*
   * v2 volontaire :
   * on ignore les anciennes valeurs en "fr"
   * qui avaient déformé les tableaux.
   */
  const persistedKey =
    `${storageKey}:v2`;

  const [
    gridTemplateColumns,
    setGridTemplateColumns,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        persistedKey,
      );

    if (saved) {
      setGridTemplateColumns(
        saved,
      );
    }
  }, [persistedKey]);

  function startResize(
    event:
      ReactPointerEvent<HTMLElement>,
    index: number,
  ) {
    if (
      index < 0 ||
      index >= columnCount - 1
    ) {
      return;
    }

    const target =
      event.currentTarget;

    const targetRect =
      target.getBoundingClientRect();

    /*
     * Le reste de l'en-tête reste cliquable.
     * Le resize ne démarre que près de la séparation.
     */
    if (
      targetRect.right -
        event.clientX >
      12
    ) {
      return;
    }

    const grid =
      target.closest(
        "[data-resizable-grid]",
      ) as HTMLElement | null;

    if (!grid) {
      return;
    }

    const rawColumns =
      window
        .getComputedStyle(grid)
        .gridTemplateColumns
        .split(/\s+/)
        .slice(0, columnCount);

    const widths =
      rawColumns.map(
        (column) =>
          Number.parseFloat(column),
      );

    if (
      widths.length !==
        columnCount ||
      widths.some(
        (width) =>
          !Number.isFinite(width),
      )
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const startX =
      event.clientX;

    const original =
      [...widths];

    const pairTotal =
      original[index] +
      original[index + 1];

    const previousCursor =
      document.body.style.cursor;

    const previousSelect =
      document.body.style.userSelect;

    document.body.style.cursor =
      "col-resize";

    document.body.style.userSelect =
      "none";

    function move(
      pointerEvent: PointerEvent,
    ) {
      const delta =
        pointerEvent.clientX -
        startX;

      const left =
        Math.max(
          minWidth,
          Math.min(
            pairTotal -
              minWidth,
            original[index] +
              delta,
          ),
        );

      const right =
        pairTotal - left;

      const next =
        [...original];

      next[index] = left;
      next[index + 1] =
        right;

      const template =
        next
          .map(
            (width) =>
              `${Math.round(
                width,
              )}px`,
          )
          .join(" ");

      setGridTemplateColumns(
        template,
      );
    }

    function stop() {
      window.removeEventListener(
        "pointermove",
        move,
      );

      window.removeEventListener(
        "pointerup",
        stop,
      );

      document.body.style.cursor =
        previousCursor;

      document.body.style.userSelect =
        previousSelect;

      /*
       * On sauvegarde la valeur finale
       * actuellement appliquée.
       */
      requestAnimationFrame(() => {
        const current =
          grid?.style
            .gridTemplateColumns;

        if (current) {
          window.localStorage.setItem(
            persistedKey,
            current,
          );
        }
      });
    }

    window.addEventListener(
      "pointermove",
      move,
    );

    window.addEventListener(
      "pointerup",
      stop,
      { once: true },
    );
  }

  return {
    gridTemplateColumns,
    startResize,
  };
}
