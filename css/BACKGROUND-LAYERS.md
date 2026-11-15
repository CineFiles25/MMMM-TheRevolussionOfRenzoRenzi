# Six exhibition themes: current layer structure

Background lists run from top to bottom. Keep image, size, position, repeat, origin and clip entries aligned; do not replace the complete list to change one photo.

## Theme 1: Baroque theatre

Handmade-paper fibres -> pale veil -> Bibiena stage architecture. Gold frame and title ornaments remain. Map and sidebar room swatches share the warm-ink filter and 94% opacity; routes/markers remain clear. Alternating masks belong to collection joins only.

## Theme 2: romantic theatre and paper

Map: historical costumes -> quill/ink -> paper fibres -> warm paper edge. Sidebar: binding -> printed paper -> page light; room cards add different figures and sketches. Collection: paper -> thin veil -> writing desk. Mobile retains the same layers.

## Theme 3: white telephones and neorealism (2026-11-15)

- Map shell has 11 layers: four pearl/scroll corner fittings -> original weathered paper -> ivory paper gradient -> four directional enamel profiles -> frame base coat.
- Sidebar shell has the same structure; its two original paper layers are fine-line wallpaper and aged paper gradient. Paper uses padding-box; fittings and enamel use border-box.
- Native rounded backgrounds replace border-image on map/sidebar. No clip-path cuts the inner frame. Catalogue and collection keep their separate ivory frame asset.
- Independent pointer-transparent ::after contains eight static cinema-archive-print SVGs, later prints above earlier prints.
- Two CSS opacity properties control two four-photo waves over TWO SECONDS. Left photographs ease from the left; right photographs ease from the right. Both waves fade in, slow down, settle and remain.
- Cross-fade has an explicit unsupported-engine fallback. Reduced-motion cancels travel while preserving progressive fades.
- The original clickable SVG stays above the photographs. cinema-map-cut-paper.svg shares its exact viewBox, contain alignment and room colours; the original bitmap is hidden visually, not deleted. Map scale is 1.035.
- Reading top/bottom trim remains fixed at 24px; rain damage, rust, stitches and reading typography remain.
- Collection retains repaired-paper texture -> dark veil -> three real film images. Header retains the original real-still PNG collage.
- Old cinema-map-memory.svg and abandoned frame/map experiments are not runtime dependencies and are excluded from this release.

## Theme 4: Fellini and Renzi

Dark cinema surroundings and a warm map screen. The screen uses twelve dedicated real stills, 1.0-1.8 seconds per shot, 15.4-second loop, subdued contrast and central light. Map exposure and slight gate weave retain real clickable markers. Grain: screen 28%, header/collection 12%, sidebar 3.5%. No full-window grain/dust; body::after is a vignette. Collection retains the premiere image. Reduced-motion uses a static screen.

## Theme 5: pastel comedy

Map: cast/symbols -> telephone -> coffee -> yellow light -> pink light. Independent ::after cycles six real comedy stills around the edges, 12 seconds total. Existing cast reactions, receiver movement, steam and entry laugh remain. Map/header/sidebar/collection behaviour unchanged.

## Theme 6: virtual cinema

Stage: cyan light -> violet light -> spatial grid -> three subdued VR entry scenes, 21-second dissolve. Holographic map shares the original viewBox; pale gold/mint/ice blue match room legends. Peripheral fireflies and subtle floating remain; no meteors or scanline. Header, sidebar footer and collection scenery retained. Reduced-motion shows static scenes.

## Maintenance

Decorative layers never intercept pointer input. Existing JS owns theme persistence, route logic and collection scrolling. This release does not edit HTML/JS/data. Teammate commit da70003 (content-page header hidden) has already been integrated and is preserved. See CSS-REVIEW.md for validation.
