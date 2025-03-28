import { BlockLibrary, BlockTypes } from './library';

// Re-export BlockTypes for use in other modules
export { BlockTypes };

// Get a specific block from the library by type
export function getBlock(type) {
  return BlockLibrary[type];
}

// Get all blocks from the library
export function getAllBlocks() {
  return Object.values(BlockLibrary);
} 