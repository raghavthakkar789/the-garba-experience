# Scroll-driven elephant invitation hand-off

The invitation scene uses five transparent sprites generated with the built-in image tool: `man.webp`, `woman.webp`, `man-arm.webp`, `woman-arm.webp`, and `elephant.webp`. The pass follows the original charcoal, gold and burgundy invitation design. `invitation-handoff.js` attaches both arms at their shoulders and drives the pass from her palm to his with native scroll progress. Rear/front compositing reveals it from behind her body. Reversing scroll reverses the entire transfer. Reading and reduced-motion modes retain the complete still illustration.

The generated sprite sheet was split into individual WebP assets without painting over the artwork. Source canvas 1024 × 1536; crop rectangles (left, top, width, height): man (90, 0, 350, 815), woman (490, 20, 520, 790), man-arm (60, 865, 420, 240), woman-arm (540, 860, 430, 240), elephant (25, 1135, 485, 375).

## Generation prompt

Use case: precise-object-edit / animation asset preparation.
Create a transparent 2-column by 3-row sprite asset sheet, 2048 x 3072 canvas, each equal cell 1024 x 1024. No labels, no panel borders. Six isolated cells with ample empty transparent gutters; nothing crosses a cell boundary. Use the supplied image as exact character and invitation reference. This is a layered puppet animation kit, so the detached arms will be attached by code.

TOP LEFT cell: the exact full-body male character, same face, hair, beard, green/gold Navratri outfit, cream trousers, shoes, looking warmly right. Keep his far arm relaxed at his side, mostly hidden behind his body. OMIT his near arm ENTIRELY from the viewer-right shoulder down; leave a neat rounded green/gold shoulder sleeve attachment at upper chest height. No hand or forearm in front of his chest. No object. Full body, feet intact.
TOP RIGHT cell: exact full-body woman, same face, braid, pink/green/gold Navratri outfit, jewelry, shoes, looking warmly left. Far arm and hand held behind her back, hidden. OMIT her near arm ENTIRELY from the viewer-left shoulder down; neat pink shoulder sleeve attachment at upper chest height. Front of dress unobstructed. No object. Full body, feet intact.
MIDDLE LEFT cell: ONE detached complete male arm matching the male outfit. Upper arm shoulder cap on LEFT, green-and-gold sleeve, elbow bent gently down, forearm stretching RIGHT, hand at far RIGHT with open palm facing up and naturally curved fingers ready to receive a thin invitation. A horizontal L-like arm with shoulder higher than hand. Include the complete shoulder-to-fingers silhouette, no torso.
MIDDLE RIGHT cell: ONE detached complete female arm matching her outfit. Shoulder cap on RIGHT, short pink-gold sleeve, bare upper arm descending gently toward elbow, forearm stretching LEFT, hand at far LEFT with palm up and gently curved fingers for holding a thin invitation. Gold bangles at wrist. Mirror the geometry of the male arm so hands can meet. Complete shoulder-to-fingers silhouette, no torso.
BOTTOM LEFT cell: ONE isolated exact flat die-cut elephant invitation from the reference. Charcoal elephant, fine gold detailing, burgundy rectangular event panel, feet down, head on right, raised curling trunk right, tail left. Gold text exactly "9th Oct" / "7.30 pm" / "onwards" / "Vivenza" / "By Gopi Farm". No hands or packaging.
BOTTOM RIGHT cell: leave completely empty transparent.
Maintain the same polished illustrated character style and identities. Transparent background, clean alpha, NO extra hands/arms, NO duplication within cells, NO cast shadows or ground. Each asset fully contained in its own cell with generous padding.

## Alpha cleanup prompt

Remove all colored background and haze, preserving the five isolated assets, their positions, sizes, and details. Keep genuinely transparent empty space and clean alpha.
