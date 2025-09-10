// src/utils/logger.js - Logger avancé avec maximum de détails
const fs = require('fs');
const path = require('path');
const os = require('os');

class AdvancedLogger {
    constructor() {
        this.logsDir = path.join(__dirname, '..', '..', 'logs');
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.logCounts = { info: 0, warn: 0, error: 0, debug: 0, success: 0 };
        
        this.ensureLogsDir();
        this.logSystemInfo();
    }

    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    ensureLogsDir() {
        try {
            if (!fs.existsSync(this.logsDir)) {
                fs.mkdirSync(this.logsDir, { recursive: true });
            }
        } catch (error) {
            console.error('❌ Impossible de créer le dossier logs:', error.message);
        }
    }

    logSystemInfo() {
        const systemInfo = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            memory: {
                total: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
                free: Math.round(os.freemem() / 1024 / 1024) + 'MB',
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
            },
            cpu: os.cpus()[0].model,
            cores: os.cpus().length,
            uptime: Math.round(os.uptime()) + 's'
        };

        this.writeToFile('SYSTEM', `SESSION STARTED: ${JSON.stringify(systemInfo, null, 2)}`);
        console.log(`🚀 [SESSION] [${this.getTimestamp()}] Nouvelle session: ${this.sessionId}`);
    }

    getTimestamp() {
        const now = new Date();
        return now.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });
    }

    getCallerInfo() {
        const stack = new Error().stack;
        const stackLines = stack.split('\n');
        
        // Chercher la ligne qui n'est pas dans logger.js
        for (let i = 3; i < stackLines.length; i++) {
            const line = stackLines[i];
            if (!line.includes('logger.js') && line.includes('at ')) {
                const match = line.match(/at (.+) \((.+):(\d+):(\d+)\)/);
                if (match) {
                    const [, functionName, filePath, lineNum, colNum] = match;
                    const fileName = path.basename(filePath);
                    return `${fileName}:${lineNum}:${colNum} ${functionName}`;
                } else {
                    const simpleMatch = line.match(/at (.+):(\d+):(\d+)/);
                    if (simpleMatch) {
                        const [, filePath, lineNum, colNum] = simpleMatch;
                        const fileName = path.basename(filePath);
                        return `${fileName}:${lineNum}:${colNum}`;
                    }
                }
            }
        }
        return 'unknown';
    }

    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            heap: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
            total: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
            external: Math.round(usage.external / 1024 / 1024) + 'MB',
            rss: Math.round(usage.rss / 1024 / 1024) + 'MB'
        };
    }

    formatMessage(level, message, data = null, options = {}) {
        const timestamp = this.getTimestamp();
        const caller = options.showCaller ? this.getCallerInfo() : '';
        const memory = options.showMemory ? this.getMemoryUsage() : null;
        const sessionInfo = `[${this.sessionId.slice(-5)}]`;
        const uptime = Math.round((Date.now() - this.startTime) / 1000) + 's';
        
        let formattedMessage = `[${level}] [${timestamp}] ${sessionInfo} [+${uptime}]`;
        
        if (caller) {
            formattedMessage += ` [${caller}]`;
        }
        
        formattedMessage += ` ${message}`;
        
        if (data !== null) {
            if (typeof data === 'object') {
                try {
                    formattedMessage += '\n📊 DATA: ' + JSON.stringify(data, this.jsonReplacer, 2);
                } catch (err) {
                    formattedMessage += '\n📊 DATA: [Circular/Non-serializable object]';
                }
            } else {
                formattedMessage += ` ${data}`;
            }
        }
        
        if (memory && options.showMemory) {
            formattedMessage += `\n💾 MEMORY: ${memory.heap} heap, ${memory.rss} RSS`;
        }
        
        return formattedMessage;
    }

    jsonReplacer(key, value) {
        // Gérer les objets circulaires et les types spéciaux
        if (typeof value === 'function') return '[Function]';
        if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
        if (value instanceof Date) return value.toISOString();
        if (typeof value === 'bigint') return value.toString() + 'n';
        return value;
    }

    writeToFile(level, message) {
        try {
            const date = new Date().toISOString().split('T')[0];
            const filename = `${date}_${this.sessionId}.log`;
            const filepath = path.join(this.logsDir, filename);
            
            fs.appendFileSync(filepath, message + '\n', 'utf8');
            
            // Créer aussi un fichier par niveau
            const levelFilename = `${date}_${level.toLowerCase()}.log`;
            const levelFilepath = path.join(this.logsDir, levelFilename);
            fs.appendFileSync(levelFilepath, message + '\n', 'utf8');
        } catch (error) {
            console.error('❌ Erreur écriture fichier log:', error.message);
        }
    }

    // Nettoyer les anciens logs (garder 30 jours)
    cleanOldLogs() {
        try {
            const files = fs.readdirSync(this.logsDir);
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            
            files.forEach(file => {
                const filepath = path.join(this.logsDir, file);
                const stats = fs.statSync(filepath);
                
                if (stats.mtime.getTime() < thirtyDaysAgo) {
                    fs.unlinkSync(filepath);
                    console.log(`🗑️ Log supprimé: ${file}`);
                }
            });
        } catch (error) {
            console.error('❌ Erreur nettoyage logs:', error.message);
        }
    }

    // ==================== MÉTHODES PUBLIQUES ====================

    info(message, data = null, options = {}) {
        this.logCounts.info++;
        const formatted = this.formatMessage('INFO', message, data, { showCaller: options.caller, showMemory: options.memory });
        console.log(`\x1b[36m${formatted}\x1b[0m`); // Cyan
        this.writeToFile('INFO', formatted);
        return this;
    }

    warn(message, data = null, options = {}) {
        this.logCounts.warn++;
        const formatted = this.formatMessage('WARN', message, data, { showCaller: options.caller, showMemory: options.memory });
        console.warn(`\x1b[33m${formatted}\x1b[0m`); // Yellow
        this.writeToFile('WARN', formatted);
        return this;
    }

    error(message, err = null, options = {}) {
        this.logCounts.error++;
        let errorData = null;
        
        if (err instanceof Error) {
            errorData = {
                name: err.name,
                message: err.message,
                stack: err.stack,
                code: err.code,
                syscall: err.syscall,
                path: err.path
            };
        } else if (err) {
            errorData = err;
        }
        
        const formatted = this.formatMessage('ERROR', message, errorData, { 
            showCaller: true, // Toujours montrer l'appelant pour les erreurs
            showMemory: options.memory 
        });
        console.error(`\x1b[31m${formatted}\x1b[0m`); // Red
        this.writeToFile('ERROR', formatted);
        
        // Envoyer une notification système si l'erreur est critique
        if (options.critical) {
            this.notifyCriticalError(message, errorData);
        }
        
        return this;
    }

    success(message, data = null, options = {}) {
        this.logCounts.success++;
        const formatted = this.formatMessage('SUCCESS', message, data, { showCaller: options.caller, showMemory: options.memory });
        console.log(`\x1b[32m${formatted}\x1b[0m`); // Green
        this.writeToFile('SUCCESS', formatted);
        return this;
    }

    debug(message, data = null, options = {}) {
        // Ne log que si en mode debug
        if (process.env.NODE_ENV !== 'development' && !process.env.DEBUG) return this;
        
        this.logCounts.debug++;
        const formatted = this.formatMessage('DEBUG', message, data, { 
            showCaller: true, 
            showMemory: options.memory || true 
        });
        console.log(`\x1b[35m${formatted}\x1b[0m`); // Magenta
        this.writeToFile('DEBUG', formatted);
        return this;
    }

    // Log spécialisé pour Discord
    discord(event, details = {}) {
        const discordData = {
            event,
            timestamp: new Date().toISOString(),
            guild: details.guild ? { id: details.guild.id, name: details.guild.name } : null,
            user: details.user ? { id: details.user.id, username: details.user.username } : null,
            channel: details.channel ? { id: details.channel.id, name: details.channel.name, type: details.channel.type } : null,
            interaction: details.interaction ? { 
                type: details.interaction.constructor.name,
                customId: details.interaction.customId,
                commandName: details.interaction.commandName 
            } : null,
            ...details.extra
        };
        
        this.info(`🤖 Discord Event: ${event}`, discordData, { caller: true });
        return this;
    }

    // Log pour base de données
    database(operation, table, details = {}) {
        const dbData = {
            operation,
            table,
            timestamp: new Date().toISOString(),
            duration: details.duration ? `${details.duration}ms` : null,
            affected: details.affected || null,
            query: details.query || null,
            params: details.params || null,
            ...details.extra
        };
        
        this.info(`🗄️ Database ${operation.toUpperCase()}: ${table}`, dbData);
        return this;
    }

    // Notification d'erreur critique
    notifyCriticalError(message, errorData) {
        const criticalLog = {
            level: 'CRITICAL',
            message,
            error: errorData,
            timestamp: new Date().toISOString(),
            systemInfo: {
                memory: this.getMemoryUsage(),
                uptime: Math.round((Date.now() - this.startTime) / 1000),
                logCounts: this.logCounts
            }
        };
        
        // Écrire dans un fichier spécial pour les erreurs critiques
        try {
            const criticalFile = path.join(this.logsDir, 'CRITICAL_ERRORS.log');
            fs.appendFileSync(criticalFile, JSON.stringify(criticalLog, null, 2) + '\n---\n');
        } catch (err) {
            console.error('❌ Impossible de logger l\'erreur critique:', err.message);
        }
    }

    // Statistiques de la session
    getStats() {
        const uptime = Math.round((Date.now() - this.startTime) / 1000);
        return {
            sessionId: this.sessionId,
            uptime: `${uptime}s`,
            logCounts: this.logCounts,
            memory: this.getMemoryUsage(),
            totalLogs: Object.values(this.logCounts).reduce((a, b) => a + b, 0)
        };
    }

    // Log des stats de session
    logStats() {
        const stats = this.getStats();
        this.info('📊 Session Statistics', stats);
        return stats;
    }

    // Arrêt propre avec nettoyage
    shutdown() {
        this.success('🛑 Logger shutdown initiated');
        this.logStats();
        this.cleanOldLogs();
        this.writeToFile('SYSTEM', `SESSION ENDED: ${new Date().toISOString()}`);
        console.log(`👋 [SESSION] [${this.getTimestamp()}] Session fermée: ${this.sessionId}`);
    }
}

// Créer une instance unique (singleton)
const logger = new AdvancedLogger();

// Nettoyer les logs au démarrage
logger.cleanOldLogs();

// Gérer l'arrêt propre
process.on('SIGINT', () => {
    logger.shutdown();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.shutdown();
    process.exit(0);
});

// Exporter l'instance
module.exports = logger;