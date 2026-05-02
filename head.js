app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head><title>EDI Training Guide Generator</title></head>
      <body style="font-family: Arial; text-align: center; margin-top: 50px;">
        <h1>IBM Sterling B2B Integrator</h1>
        <p>Click the button to generate your complete job-ready training guide (Word document).</p>
        <button onclick="window.location.href='/generate'">Download DOCX</button>
        <p style="font-size: 0.9em; margin-top: 30px;">The file will be generated on-the-fly from the latest content.</p>
      </body>
    </html>
  `);
});