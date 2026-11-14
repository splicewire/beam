/**
 * The CURRENT `beam-config` frame manifest entry (resources + contexts), as laravel-frame's own `ContextManifest` builds it
 * for FrameManifestController, dumped from splicewire-app 6eb7ddc76 (laravel-beam a0ad1cab2's ConfigSectionData) with an
 * anonymous actor (every `can` false; `byNode` is unaffected). Generated from that dump, never hand-edited: its
 * `list-column` set is root / title / owner, so a host column can only override those three (frame's manifest contract).
 */
import type { FrameManifest } from '@schemastud/frame';

export const BEAM_CONFIG_MANIFEST = {
    "resources": [
        {
            "key": "beam-config",
            "data": "Splicewire.Beam.Data.Config.ConfigSectionData",
            "creatable": false,
            "editData": null,
            "nav": {
                "label": "Config",
                "group": null,
                "icon": null,
                "section": null,
                "navOrder": null,
                "routeName": null
            },
            "form": "enriched",
            "layout": null,
            "deletable": false,
            "editable": false,
            "showable": true,
            "createAffordance": "frame",
            "singularLabel": "Config section",
            "createResultData": null,
            "actions": [],
            "collections": []
        }
    ],
    "contexts": {
        "beam-config": {
            "byNode": {
                "root": {
                    "list-column": {
                        "participates": true,
                        "sort": 0,
                        "label": "Root"
                    }
                },
                "title": {
                    "list-column": {
                        "participates": true,
                        "sort": 1,
                        "label": "Section"
                    }
                },
                "owner": {
                    "list-column": {
                        "participates": true,
                        "sort": 2,
                        "label": "Owner"
                    }
                }
            },
            "inherits": {
                "row-cell": [
                    "edit"
                ],
                "overview": [
                    "summary"
                ]
            },
            "known": [
                "edit",
                "detail",
                "list-column",
                "list-item",
                "row-cell",
                "summary",
                "overview"
            ],
            "layout": null,
            "createAffordance": "host",
            "singularLabel": "Config section",
            "can": []
        }
    }
} as unknown as FrameManifest;
