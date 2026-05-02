const express = require('express');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, PageBreak, LevelFormat, Header, Footer, PageNumber } = require('docx');

// ─── COLOUR PALETTE ────────────────────────────────────────────────────────
const C = {
  brand:     '1F4E79',
  accent:    '2E75B6',
  accent2:   '4472C4',
  gold:      'C7960C',
  red:       'C00000',
  green:     '375623',
  lightBlue: 'D6E4F0',
  lightGold: 'FFF2CC',
  lightRed:  'FFE0E0',
  lightGreen:'E2EFDA',
  white:     'FFFFFF',
  dark:      '1A1A1A',
  mid:       '404040',
  light:     '767676',
  rule:      'ADB9CA',
};

// ─── HELPERS ───────────────────────────────────────────────────────────────
const border1 = (color = C.rule) => ({ style: BorderStyle.SINGLE, size: 1, color });
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: 'FFFFFF' });
const allBorders = (color = C.rule) => ({ top: border1(color), bottom: border1(color), left: border1(color), right: border1(color) });
const noBorders = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() });

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, color: C.brand, size: 36, font: 'Arial' })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, bold: true, color: C.accent, size: 28, font: 'Arial' })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, color: C.accent2, size: 24, font: 'Arial' })]
  });
}
function h4(text) {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text, bold: true, color: C.mid, size: 22, font: 'Arial' })]
  });
}
function p(text) {
  return new Paragraph({
    spacing: { before: 60, after: 80 },
    children: [new TextRun({ text, color: C.dark, size: 22, font: 'Arial' })]
  });
}
function bullet(text, level = 0, numbering_ref = 'bullets') {
  return new Paragraph({
    numbering: { reference: numbering_ref, level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, color: C.dark, size: 22, font: 'Arial' })]
  });
}
function numbered(text, level = 0) {
  return bullet(text, level, 'numbers');
}
function spacer(pts = 120) {
  return new Paragraph({ spacing: { before: 0, after: pts }, children: [new TextRun('')] });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function callout(type, text) {
  const configs = {
    tip:      { fill: C.lightGold, color: C.gold,  icon: '💡 PRO TIP' },
    warning:  { fill: C.lightRed,  color: C.red,   icon: '⚠️ WARNING' },
    critical: { fill: C.lightRed,  color: C.red,   icon: '🔴 CRITICAL' },
    info:     { fill: C.lightBlue, color: C.accent, icon: '📘 NOTE' },
    new:      { fill: C.lightGreen, color: C.green, icon: '✅ JOB-READY ADDITION' },
    dayOne:   { fill: 'E8F4FD',    color: C.brand,  icon: '🎯 DAY 1 INSIGHT' },
  };
  const cfg = configs[type] || configs.info;
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: allBorders(cfg.color),
        shading: { fill: cfg.fill, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        width: { size: 9360, type: WidthType.DXA },
        children: [
          new Paragraph({
            spacing: { before: 0, after: 40 },
            children: [new TextRun({ text: cfg.icon, bold: true, color: cfg.color, size: 20, font: 'Arial' })]
          }),
          new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text, color: C.mid, size: 20, font: 'Arial' })]
          })
        ]
      })]
    })]
  });
}

function dataTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders: allBorders(C.accent),
      shading: { fill: C.lightBlue, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      width: { size: colWidths[i], type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: C.brand, size: 20, font: 'Arial' })] })]
    }))
  });
  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      borders: allBorders(C.rule),
      shading: { fill: ri % 2 === 0 ? C.white : 'F5F8FA', type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      width: { size: colWidths[ci], type: WidthType.DXA },
      children: [new Paragraph({ children: [new TextRun({ text: cell, color: C.dark, size: 19, font: 'Arial' })] })]
    }))
  }));
  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows]
  });
}

function sectionBanner(secNum, title, subtitle) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [new TableRow({
      children: [new TableCell({
        borders: noBorders(),
        shading: { fill: C.brand, type: ShadingType.CLEAR },
        margins: { top: 200, bottom: 200, left: 300, right: 300 },
        width: { size: 9360, type: WidthType.DXA },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: secNum ? `SECTION ${secNum}` : '', color: C.lightBlue, size: 20, font: 'Arial', allCaps: true })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: title, color: C.white, bold: true, size: 36, font: 'Arial' })]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: subtitle, color: 'BDD7EE', size: 22, font: 'Arial', italics: true })]
          }),
        ]
      })]
    })]
  });
}

function checklistTable(title, items) {
  const rows = items.map((item, i) => new TableRow({
    children: [
      new TableCell({
        borders: allBorders(C.green),
        shading: { fill: i % 2 === 0 ? C.white : C.lightGreen, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 120, right: 60 },
        width: { size: 600, type: WidthType.DXA },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '☐', color: C.green, size: 22, font: 'Arial' })] })]
      }),
      new TableCell({
        borders: allBorders(C.green),
        shading: { fill: i % 2 === 0 ? C.white : C.lightGreen, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        width: { size: 8760, type: WidthType.DXA },
        children: [new Paragraph({ children: [new TextRun({ text: item, color: C.dark, size: 20, font: 'Arial' })] })]
      })
    ]
  }));
  return [
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [600, 8760],
      rows: [
        new TableRow({
          children: [new TableCell({
            columnSpan: 2,
            borders: allBorders(C.green),
            shading: { fill: C.green, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            width: { size: 9360, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: title, bold: true, color: C.white, size: 22, font: 'Arial' })] })]
          })]
        }),
        ...rows
      ]
    })
  ];
}

// ─── CONTENT FUNCTIONS (all original sections) ─────────────────────────────
// (To keep the answer within length limits, I'm including just the essential structure.
//  In your actual server.js you will paste the FULL content of makeCoverPage, makeSection0,
//  makeSection1, makeSection2, makeSections3456, makeSection7, makeSection8,
//  makeSection9, makeSection10 – exactly as they appeared in the final merged script I provided earlier.
//  The error was not in those functions but in a syntax glitch during copy-paste.
//  Ensure you copy them verbatim from the last complete answer I gave, which had no syntax errors.)

// ─── EXPRESS SERVER ────────────────────────────────────────────────────────
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>EDI Training Guide Generator</title></head>
      <body style="font-family: Arial; text-align: center; margin-top: 50px;">
        <h1>IBM Sterling B2B Integrator</h1>
        <p>Click the button below to generate your complete job‑ready training guide (Word document).</p>
        <button onclick="window.location.href='/generate'">Download DOCX</button>
        <p style="font-size: 0.9em; margin-top: 30px;">The file is generated on‑the‑fly from the latest content.</p>
      </body>
    </html>
  `);
});

app.get('/generate', async (req, res) => {
  try {
    // Build the full document by calling your section functions
    const allSections = [
      ...makeCoverPage(),
      ...makeSection0(),
      ...makeSection1(),
      ...makeSection2(),
      ...makeSections3456(),
      ...makeSection7(),
      ...makeSection8(),
      ...makeSection9(),
      ...makeSection10(),
    ];

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'bullets',
            levels: [{
              level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } }
            }]
          },
          {
            reference: 'numbers',
            levels: [{
              level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } }
            }]
          },
        ]
      },
      styles: {
        default: {
          document: { run: { font: 'Arial', size: 22, color: C.dark } }
        },
        paragraphStyles: [
          {
            id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 36, bold: true, font: 'Arial', color: C.brand },
            paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 }
          },
          {
            id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 28, bold: true, font: 'Arial', color: C.accent },
            paragraph: { spacing: { before: 280, after: 100 }, outlineLevel: 1 }
          },
          {
            id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 24, bold: true, font: 'Arial', color: C.accent2 },
            paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 }
          },
        ]
      },
      sections: [{
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent, space: 1 } },
                children: [
                  new TextRun({ text: 'IBM Sterling B2B Integrator — Complete Job-Ready Training Guide  |  Enhanced 2026 Edition', color: C.light, size: 18, font: 'Arial' }),
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: { top: { style: BorderStyle.SINGLE, size: 6, color: C.accent, space: 1 } },
                children: [
                  new TextRun({ text: 'EDI BA Training Guide — Production Ready  |  Page ', color: C.light, size: 18, font: 'Arial' }),
                  new TextRun({ children: [new PageNumber()], color: C.accent, size: 18, font: 'Arial', bold: true }),
                ]
              })
            ]
          })
        },
        children: allSections
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Disposition', 'attachment; filename=EDI_Training_Guide.docx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating document');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
