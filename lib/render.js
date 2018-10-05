'use strict';

const t = (x, y) => ({transform: 'translate(' + (x || 0) + ',' + (y || 0) + ')'});

module.exports = cfg => {
    cfg = cfg || {};
    cfg.minDim = Math.min(cfg.w, cfg.h);
    cfg.r = cfg.minDim / 3;

    const arc = (x1, y1, x2, y2, cfg) => {
        const r = (cfg.r / 5) | 0;
        return (cfg && cfg.loops && (x1 === x2) && (y1 === y2))
            ? 'M0 0 A' + r + ' ' + r + ' 0 1 1 ' + (0.0001 * -y1) + ' ' + (0.0001 * x1)
            : 'M0,0 L' + ((x2 - x1) |0) + ',' + ((y2 - y1) |0);
    };

    const placeNodes = (cfg, g) => {
        const g1 = Array.isArray(g)
            ? g.map((n, i) => ({
                name: n.name || i,
                edges: n
            }))
            : Object.keys(g).map(key => ({
                name: key,
                edges: g[key]
            }));

        const gAngle = 2 * Math.PI / g1.length;

        const nodes = g1.reduce((prev, cur, i) => {
            prev[cur.name] = i;
            return prev;
        }, {});

        g1.map((n, ni) => {
            const edges = n.edges;
            n.edges = Array.isArray(edges)
                ? edges.map(e => (typeof e === 'object') ? e : {label: ni + '→' + e, target: e})
                : Object.keys(edges).map(key => ({
                    target: nodes[key],
                    label: edges[key]
                }));
        });

        const g2 = g1.map((n, i) => {
            n.x = cfg.r * Math.sin(gAngle * i);
            n.y = cfg.r * -Math.cos(gAngle * i);
            return n;
        });

        return g2;
    };

    const getSvg = cfg => ['svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        width: cfg.w + 1,
        height: cfg.h + 1,
        viewBox: [0, 0, cfg.w + 1, cfg.h + 1].join(' ')
    },
    ['defs', {}, ['marker', {
        id: 'arrow',
        markerWidth: 10, markerHeight: 10,
        refX: 27, refY: 3,
        orient: 'auto',
        markerUnits: 'strokeWidth'
    }, ['path', {d: 'M0,0 L0,6 L9,3 z', fill: '#000'}]]],
    ['style', {}, `
        text { alignment-baseline: middle; text-anchor: middle; font-family: Roboto; }
        .a1 { stroke: #000; fill: none; marker-end: url(#arrow); }
        .node { fill: #f00; }
        .edge { fill: #00f; }
    `]
    ];

    const getFrame = cfg => ['g', t(cfg.w / 2 + .5, cfg.h / 2 + .5),
        ['circle', {r: cfg.r, fill: 'none', stroke: '#777', 'stroke-dasharray':'5 15'}]
    ];

    const getNodes = g => g.map(n => ['g', t(n.x, n.y),
        ['ellipse', {rx: Math.max(n.name.toString().length * 6, 16), ry: 16, fill: '#eee', stroke: '#000'}],
        ['text', {class: 'node'}, n.name]
    ]);

    const getEdges = (cfg, g) => g.map((n, i) => ['g', t(n.x, n.y)]
        .concat(n.edges.map(e => {
            const ni = e.target;
            const eLabel = e.label; // i + '→' + ni;
            const x = ((i === ni) && cfg.loops) ? n.x / 2.5 : (g[ni].x - n.x) / 2;
            const y = ((i === ni) && cfg.loops) ? n.y / 2.5 : (g[ni].y - n.y) / 2;
            return ['g', {},
                ['path', {
                    d: arc(n.x, n.y, g[ni].x, g[ni].y, cfg),
                    class: 'a1'
                }],
                ['text', {stroke: '#fff', 'stroke-width': 5, x: x, y: y}, eLabel],
                ['text', {class: 'edge', x: x, y: y}, eLabel]
            ];
        }))
    );

    const render = g => {
        g = placeNodes(cfg, g);
        return getSvg(cfg)
            .concat([getFrame(cfg)
                .concat(getEdges(cfg, g))
                .concat(getNodes(g))
            ]);
    };

    return render;
    // return g => onml.s(render(g));
};
