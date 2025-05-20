I'd like to generate different styled voxel environments, each with specific rules for block types, colors, textures, and placement logic. Please provide structured and detailed rules for generating the following chunk environments:

---

### 🌴 Beach Chunk:
- **Surface Composition**:
  - Surface: Sand blocks (light yellow texture with subtle grain)
  - Below: Mix of sand and sandstone blocks (sandstone has slight layering)
- **Water**:
  - At lower elevations, fill with transparent blue water blocks
  - Water level should be constant (e.g., y = 10), terrain should slope toward it
- **Decoration**:
  - Occasional small palm trees (1 block wide trunk + green fronds on top)
  - Seashell textures on surface randomly placed (flat block)
- **Color Variation**:
  - Slight brightness changes based on position for visual variety

---

### 🌲 Forest Chunk:
- **Surface Composition**:
  - Surface: Grass blocks (bright green with texture)
  - Below: Dirt layers with darkening based on depth
  - Occasional patches of coarse dirt or podzol
- **Trees**:
  - Spawn procedural trees (3–5 block trunks + leafy top using leaf texture with transparency)
  - Random types: Pine, oak, birch (variation in bark and leaf textures)
- **Decoration**:
  - Grass, bushes, and flowers randomly distributed
  - Occasional rocks (grey textured voxels)
- **Color Variation**:
  - Grass/leaf tones vary subtly per tree to add natural variety

---

### 🏜️ Desert Chunk:
- **Surface Composition**:
  - Surface: Sand blocks (yellow-beige texture)
  - Below: Sandstone with visible sediment lines
  - Occasional cracked dry-earth texture
- **Vegetation**:
  - Rare cactus blocks (green, 1–3 blocks tall)
  - No trees or dense flora
- **Decoration**:
  - Skeleton remains or fossils (optional texture)
  - Rocks with brown/red tints
- **Color Variation**:
  - Add light red/yellow variations to sand for depth and heat illusion

---

### 🌴 Jungle Chunk:
- **Surface Composition**:
  - Dense grass (dark, rich green textures)
  - Moist dirt underneath (dark brown with moss hints)
- **Vegetation**:
  - Large trees (thick trunks + wide canopy)
  - Vines hanging from leaves
  - Ferns and shrubs cover the ground
- **Decoration**:
  - Jungle flowers and glowing mushrooms
  - Mossy stone blocks randomly placed
- **Color Variation**:
  - High color richness: multiple tones of green
  - Slight fog overlay effect (optional for visual depth)

---

### General Texture Rules:
- **Texture Mapping**:
  - keep the voxels features
- **Priorities**:
  - Place decorative elements *after* base terrain generation
  - Trees and plants should not overwrite important terrain features
- **Light and Shadow**:
  - Simulate basic lighting based on height or exposure

---

These rules should help you create modular and stylistically rich voxel chunk generators for various biomes. Keep the systems extensible so that you can plug in new environments easily.