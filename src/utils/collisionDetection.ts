import {
  closestCenter,
  CollisionDetection,
  pointerWithin,
  rectIntersection,
  UniqueIdentifier,
} from "@dnd-kit/core";

/**
 * Custom collision detection that prefers droppable containers (tiers) over
 * individual sortable items when the pointer is inside a container. Falls back
 * to closestCenter for items so reordering within a tier still works.
 */
export function buildCollisionDetection(containerIds: UniqueIdentifier[]): CollisionDetection {
  return (args) => {
    // First check if the pointer is inside any droppable container
    const pointerCollisions = pointerWithin(args);
    const pointerOverContainer = pointerCollisions.find((c) => containerIds.includes(c.id));

    if (pointerOverContainer) {
      // We're inside a container – find sortable items within that container
      // plus the container itself so the drop resolves correctly
      const containerCollisions = pointerCollisions.filter(
        (c) => c.id === pointerOverContainer.id || !containerIds.includes(c.id),
      );
      if (containerCollisions.length > 0) {
        return containerCollisions;
      }
      return [pointerOverContainer];
    }

    // Fallback: use rectIntersection to find any overlapping containers,
    // then closestCenter for precise item-level resolution
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }

    return closestCenter(args);
  };
}
