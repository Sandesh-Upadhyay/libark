# Admin Screen Backup

This directory stores a backup of the previous tab-based admin screen before migration to the newer list-based admin UI.

## Backup File

- `index-tab-based.tsx`: original tab-based admin component

## Restore

If needed, restore the old screen with your normal git/file restore workflow for `index-tab-based.tsx`.

## Notes

- Remove this backup only after validating the new list-based admin UI in production-like conditions
- If restoring, verify compatibility with newer tables such as `SiteFeatureSetting` and `UserFeaturePermission`
