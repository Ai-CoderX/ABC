import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { cmd } from '../command.js';
import fs from 'fs-extra';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===============================
// COMMAND: dl-session (Download Session Files)
// ===============================
cmd({
    pattern: "dls",
    desc: "Download all session files as ZIP",
    category: "owner",
    react: "📁",
    filename: __filename,
    isOwner: true
}, async (conn, mek, m, { from, reply, react }) => {
    try {
        await react("⏳");

        const sessionPath = join(process.cwd(), 'session');
        
        // Check if session folder exists
        if (!fs.existsSync(sessionPath)) {
            return reply("❌ No session folder found!");
        }

        // Get all session folders
        const sessionFolders = fs.readdirSync(sessionPath).filter(f => 
            f.startsWith('session_') && fs.statSync(join(sessionPath, f)).isDirectory()
        );

        if (sessionFolders.length === 0) {
            return reply("❌ No session folders found!");
        }

        // Create temp directory
        const tempDir = join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        // Create ZIP file
        const zip = new AdmZip();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const zipName = `sessions_backup_${timestamp}.zip`;

        // Add each session folder to ZIP
        for (const folder of sessionFolders) {
            const folderPath = join(sessionPath, folder);
            const files = fs.readdirSync(folderPath);
            
            for (const file of files) {
                const filePath = join(folderPath, file);
                const fileContent = fs.readFileSync(filePath);
                zip.addFile(`${folder}/${file}`, fileContent);
            }
        }

        // Save ZIP
        const zipPath = join(tempDir, zipName);
        zip.writeZip(zipPath);

        const stats = fs.statSync(zipPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        // Send ZIP file
        await conn.sendMessage(from, {
            document: fs.readFileSync(zipPath),
            mimetype: 'application/zip',
            fileName: zipName,
            caption: `📁 *Session Backup*

• Sessions: ${sessionFolders.length}
• Size: ${sizeMB} MB
• Date: ${new Date().toLocaleString()}

> *Powered By KHAN-MD*`
        }, { quoted: mek });

        // Cleanup
        fs.unlinkSync(zipPath);
        await react("✅");

    } catch (error) {
        console.error("DL-Session Error:", error.message);
        await react("❌");
        reply(`❌ Failed to download session!\n\n${error.message}`);
    }
});
