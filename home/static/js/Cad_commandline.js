/* =========================================================
   Safarest – CAD / Estimation command line
   Type commands like AutoCAD: LINE, RECT, CIRCLE, ERASE, GRID, ZOOM,
   plus estimation calculators: VOL, AREA, PERIM, CAREA, CVOL, STEEL, CALC.
   Uses the existing window.setTool / toggleGrid / resetZoom functions.
   ========================================================= */
(function () {
    'use strict';

    var input, log, promptEl;
    var history = [];
    var histIdx = 0;
    var lastCommand = '';

    /* ---------- helpers ---------- */
    function fmt(n) {
        if (!isFinite(n)) return String(n);
        return String(parseFloat(n.toFixed(4)));
    }

    function print(text, cls) {
        if (!log) return;
        var line = document.createElement('div');
        line.className = 'cmd-line' + (cls ? ' ' + cls : '');
        line.textContent = text;
        log.appendChild(line);
        while (log.children.length > 60) log.removeChild(log.firstChild);
        log.scrollTop = log.scrollHeight;
        log.classList.add('has-lines');
    }

    function setPrompt(name) {
        if (promptEl) promptEl.textContent = 'Command: ' + name.toUpperCase();
    }

    function nums(args, count, usage) {
        if (args.length < count) { print('Usage: ' + usage, 'cmd-err'); return null; }
        var out = [];
        for (var i = 0; i < args.length; i++) {
            var v = parseFloat(args[i]);
            if (isNaN(v)) { print('Invalid number: ' + args[i], 'cmd-err'); return null; }
            out.push(v);
        }
        return out;
    }

    function callTool(tool) {
        if (typeof window.setTool !== 'function') {
            print('CAD engine not ready yet.', 'cmd-err');
            return;
        }
        window.setTool(tool);
        setPrompt(tool);
        print('Tool: ' + tool.toUpperCase());
    }

    /* ---------- command table ---------- */
    var commands = {
        select:  { aliases: ['s', 'sel'], help: 'Select tool', run: function () { callTool('select'); } },
        line:    { aliases: ['l'], help: 'Draw line', run: function () { callTool('line'); } },
        rect:    { aliases: ['rec', 'rectangle'], help: 'Draw rectangle', run: function () { callTool('rect'); } },
        circle:  { aliases: ['c', 'cir'], help: 'Draw circle', run: function () { callTool('circle'); } },
        erase:   { aliases: ['e', 'del', 'delete'], help: 'Erase tool', run: function () { callTool('erase'); } },
        grid:    { aliases: ['g'], help: 'Toggle grid', run: function () {
            if (typeof window.toggleGrid === 'function') { window.toggleGrid(); print('Grid toggled.'); }
            else print('CAD engine not ready yet.', 'cmd-err');
        } },
        zoom:    { aliases: ['z', 'ze', 'extents'], help: 'Zoom extents', run: function () {
            if (typeof window.resetZoom === 'function') { window.resetZoom(); print('Zoom extents.'); }
            else print('CAD engine not ready yet.', 'cmd-err');
        } },
        sheet:   { aliases: ['spreadsheet', 'sh'], help: 'Switch to spreadsheet tab', run: function () {
            if (typeof window.switchAppTab === 'function') { window.switchAppTab('spreadsheet'); print('Spreadsheet.'); }
        } },
        cad:     { aliases: [], help: 'Switch to CAD tab', run: function () {
            if (typeof window.switchAppTab === 'function') { window.switchAppTab('cad'); print('CAD view.'); }
        } },
        clear:   { aliases: ['cls'], help: 'Clear command history', run: function () {
            log.innerHTML = ''; log.classList.remove('has-lines');
        } },

        /* ----- estimation calculators (units: metres → m, m², m³) ----- */
        vol:     { aliases: ['volume'], usage: 'VOL length breadth height [nos]',
                   help: 'Volume = L x B x H x nos (m³)', run: function (a) {
            var n = nums(a, 3, this.usage); if (!n) return;
            var nos = n[3] || 1;
            print('Volume = ' + fmt(n[0] * n[1] * n[2] * nos) + ' m³' + (nos !== 1 ? ' (' + nos + ' nos)' : ''), 'cmd-ok');
        } },
        area:    { aliases: [], usage: 'AREA length breadth',
                   help: 'Rectangle area (m²)', run: function (a) {
            var n = nums(a, 2, this.usage); if (!n) return;
            print('Area = ' + fmt(n[0] * n[1]) + ' m²', 'cmd-ok');
        } },
        perim:   { aliases: ['perimeter'], usage: 'PERIM length breadth',
                   help: 'Rectangle perimeter (m)', run: function (a) {
            var n = nums(a, 2, this.usage); if (!n) return;
            print('Perimeter = ' + fmt(2 * (n[0] + n[1])) + ' m', 'cmd-ok');
        } },
        carea:   { aliases: ['circlearea'], usage: 'CAREA radius',
                   help: 'Circle area (m²)', run: function (a) {
            var n = nums(a, 1, this.usage); if (!n) return;
            print('Area = ' + fmt(Math.PI * n[0] * n[0]) + ' m²', 'cmd-ok');
        } },
        cvol:    { aliases: ['cylinder'], usage: 'CVOL radius height [nos]',
                   help: 'Cylinder / circular column volume (m³)', run: function (a) {
            var n = nums(a, 2, this.usage); if (!n) return;
            var nos = n[2] || 1;
            print('Volume = ' + fmt(Math.PI * n[0] * n[0] * n[1] * nos) + ' m³', 'cmd-ok');
        } },
        steel:   { aliases: ['rebar'], usage: 'STEEL dia_mm length_m [nos]',
                   help: 'Steel weight = D²/162 x L x nos (kg)', run: function (a) {
            var n = nums(a, 2, this.usage); if (!n) return;
            var nos = n[2] || 1;
            var perM = (n[0] * n[0]) / 162;
            print('Unit wt = ' + fmt(perM) + ' kg/m  |  Total = ' + fmt(perM * n[1] * nos) + ' kg', 'cmd-ok');
        } },
        calc:    { aliases: ['='], usage: 'CALC expression   e.g. CALC (2.5*1.8*0.45)*4',
                   help: 'Evaluate an arithmetic expression', run: function (a) {
            var expr = a.join(' ').replace(/\^/g, '**');
            if (!expr) { print('Usage: ' + this.usage, 'cmd-err'); return; }
            if (!/^[0-9+\-*/().%\s]+$/.test(expr)) { print('Only numbers and + - * / ( ) % ^ allowed.', 'cmd-err'); return; }
            try {
                var r = Function('"use strict"; return (' + expr + ')')();
                print('= ' + fmt(r), 'cmd-ok');
            } catch (e) { print('Invalid expression.', 'cmd-err'); }
        } },

        help:    { aliases: ['?'], help: 'List commands', run: function () {
            Object.keys(commands).forEach(function (k) {
                var c = commands[k];
                var al = c.aliases && c.aliases.length ? ' (' + c.aliases.join(', ').toUpperCase() + ')' : '';
                print(k.toUpperCase() + al + ' – ' + c.help + (c.usage ? '  → ' + c.usage : ''), 'cmd-help');
            });
        } }
    };

    var lookup = {};
    Object.keys(commands).forEach(function (k) {
        lookup[k] = k;
        (commands[k].aliases || []).forEach(function (al) { lookup[al] = k; });
    });

    /* ---------- run ---------- */
    function execute(raw) {
        var text = raw.trim();
        if (!text) {
            if (!lastCommand) return;
            text = lastCommand; // Enter on empty line repeats last command
        }
        print('> ' + text, 'cmd-echo');
        lastCommand = text;
        if (history[history.length - 1] !== text) history.push(text);
        histIdx = history.length;

        var parts = text.split(/\s+/);
        var name = lookup[parts[0].toLowerCase()];
        if (!name) {
            print('Unknown command "' + parts[0] + '". Type HELP for the list.', 'cmd-err');
            return;
        }
        commands[name].run.call(commands[name], parts.slice(1));
    }

    /* ---------- init ---------- */
    function init() {
        input = document.getElementById('cad-cmd-input');
        log = document.getElementById('cad-cmd-log');
        promptEl = document.getElementById('cad-command-text');
        if (!input) return;

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                execute(input.value);
                input.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
                else { histIdx = history.length; input.value = ''; }
            } else if (e.key === 'Escape') {
                input.value = '';
                input.blur();
            }
            e.stopPropagation(); // keep CAD hotkeys from firing while typing
        });

        /* AutoCAD-style: start typing anywhere on the CAD pane to focus the line */
        document.addEventListener('keydown', function (e) {
            var cadPane = document.getElementById('cad-pane');
            if (!cadPane || !cadPane.classList.contains('active')) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            var t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            if (e.key.length === 1) input.focus();
        });

        print('Command line ready. Type HELP for commands.', 'cmd-help');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();