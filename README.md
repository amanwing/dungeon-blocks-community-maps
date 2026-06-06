# Dungeon Blocks Community Maps

This repository is a community-driven collection of maps created with Dungeon Blocks Builder. Its purpose is to provide a single, centralized place to share, discover, and maintain community-made maps.

Many community members currently share maps via various cloud storage services. While this works, it makes discovery, tracking updates, and long-term availability difficult. This repository aims to solve that by offering a structured, versioned, and searchable home for community content.

## Adding maps

### For non-technical contributors
If you are not familiar with GitHub, Git, or programming, the easiest way to contribute is to create a new Issue with the relevant information and a link to your map files.

Please include:
* A short description of the map or project
* A link to a shared folder (Google Drive, Dropbox, etc.)
* The map file(s)
* At least one screenshot of the map

From there, contributors with a more technical background can create a proper Pull Request to include the maps in the repository.

[Create a new issue here](https://github.com/Cliffback/dungeon-blocks-community-maps/issues/new)


### For technical contributors
* Fork the repository
* Under the maps directory, create a folder named after the creator (GitHub username or creator name)
* Inside that folder, create a subfolder for the campaign, setting, or project
* Add the map file(s) and a screenshot for each map

```
maps/
└── username/
    └── campaign-setting/
        ├── map-name.json
        └── map-name.png
```

**Notes**:

* Screenshots should have the same base name as the map file
* Multiple maps may exist within the same project folder
* Keep names descriptive and consistent
* Once complete, submit a Pull Request.

## Website

The contents of the repo are visualized in a static GitHub Page built from the main branch. It can be accessed here: [dungeon-blocks-community-maps](https://cliffback.github.io/dungeon-blocks-community-maps/)

## Local Development

To build the site and test locally:

```bash
npm run build    # Generate manifest.json from maps/
npm run serve    # Serve the site on localhost
npm run start    # Build and serve in one step
```

Then open the URL printed by serve (usually `http://localhost:3000`).

## CI and Validation

Pull requests that touch the `maps/` folder are automatically validated:

* Folder ownership: Contributors can only modify their own folder
* Image pairing: Every `.json` must have a matching image
* JSON schema: Valid JSON with title, id, levels, creationDate
* File size limits: Max 5 MB images, 1 MB JSON
* No duplicate IDs across users

## Going forward

Planned or potential improvements include:

* Basic metadata conventions (setting, location, module, etc.)

## Disclaimer
This project is not affiliated with, endorsed by, or connected to the team behind Dungeon Blocks. It is a purely community-created initiative intended to support sharing and collaboration.
