# Third-party data

## Exercise catalog

GunLifeOS searches exercise metadata from
[`hasaneyldrm/exercises-dataset`](https://github.com/hasaneyldrm/exercises-dataset).

- Code, dataset structure, metadata, and instruction text: MIT license.
- GunLifeOS currently uses only exercise names, body parts, equipment, targets,
  muscle metadata, and English instruction text.
- The upstream dataset does not include Vietnamese. GunLifeOS adds its own
  Vietnamese gym terminology layer while keeping the English exercise name
  visible for reference and search.
- The source repository's images and GIF animations have separate Gym visual
  terms. GunLifeOS intentionally does not fetch, display, copy, or redistribute
  those media assets.
- The catalog request is server-side and cached for 24 hours. Manual exercise
  entry remains available if the source cannot be reached.
