import { getInput, setFailed } from '@actions/core';
import { context, getOctokit } from '@actions/github';

interface VulnerabilitySource {
    source: number;
    name: string;
    dependency: string;
    title: string;
    url: string;
    severity: string;
    cwe: string[];
    cvss: {
        score: number;
        vectorString: string;
    };
    range: string;
}

interface Vulnerability {
    name: string;
    severity: string;
    isDirect: boolean;
    via: (string | VulnerabilitySource)[];
    effects: string[];
    range: string;
    nodes: string[];
    fixAvailable: boolean | {
        name: string;
        version: string;
        isSemVerMajor: boolean;
    };
}

interface AuditData {
    auditReportVersion: number;
    vulnerabilities: Record<string, Vulnerability>;
    metadata: {
        vulnerabilities: {
            info: number;
            low: number;
            moderate: number;
            high: number;
            critical: number;
            total: number;
        };
        dependencies: {
            prod: number;
            dev: number;
            optional: number;
            peer: number;
            peerOptional: number;
            total: number;
        };
    };
}

const main = async (projectName: string) => {
    const stdin = process.openStdin();

    let auditJson = "";

    stdin.on('data', (chunk: string): void => {
        auditJson += chunk;
    });

    stdin.on('end', async (): Promise<void> => {
        const message = auditJson;
        const formattedMessage = formatAuditReport(message, projectName);
        
        // For testing, log to console
        // console.log('START OF BODY');
        // console.log(formattedMessage);
        // console.log('END OF BODY');
        
        // For production, comment on PR (uncomment when ready)
        const github_token = getInput('github_token');
        
        if (context.payload.pull_request == null) {
            setFailed('No pull request found.');
            return;
        }
        const pull_request_number = context.payload.pull_request.number;
        
        await createCommentOnPr(context.repo, pull_request_number, formattedMessage, github_token);
    });
}

const createCommentOnPr = async (repoContext: { owner: string, repo: string }, prNumber: number, message: string, token: string) => {
    try {
        const octokit = getOctokit(token);

        await octokit.issues.createComment({
            ...repoContext,
            issue_number: prNumber,
            body: message
        });

    } catch (error) {
        setFailed(error instanceof Error ? error.message : 'Unknown error occurred');
    }
}

const formatAuditReport = (auditOutput: string, projectName: string): string => {
    try {
        const auditData: AuditData = JSON.parse(auditOutput);
        
        if (!auditData.vulnerabilities || Object.keys(auditData.vulnerabilities).length === 0) {
            return "✅ **No vulnerabilities found!** Your dependencies are secure.";
        }

        const vulnerabilities = auditData.vulnerabilities;
        const metadata = auditData.metadata?.vulnerabilities || {};
        
        let report = "## 🔍 NPM Audit Report for: " + projectName + "\n\n";
        
        // Summary table
        report += "### 📊 Summary\n\n";
        report += "| Severity | Count |\n";
        report += "|----------|-------|\n";
        if (metadata.critical > 0) report += `| 🔴 Critical | ${metadata.critical} |\n`;
        if (metadata.high > 0) report += `| 🟠 High | ${metadata.high} |\n`;
        if (metadata.moderate > 0) report += `| 🟡 Moderate | ${metadata.moderate} |\n`;
        if (metadata.low > 0) report += `| 🟢 Low | ${metadata.low} |\n`;
        if (metadata.info > 0) report += `| ℹ️ Info | ${metadata.info} |\n`;
        report += `| **Total** | **${metadata.total || 0}** |\n\n`;
        
        // Detailed vulnerabilities table
        report += "### 🚨 Vulnerability Details\n\n";
        report += "| Package | Severity | Current Range | Fix Available | Description |\n";
        report += "|---------|----------|---------------|---------------|-------------|\n";
        
        Object.entries(vulnerabilities).forEach(([packageName, vuln]: [string, Vulnerability]) => {
            const severity = getSeverityEmoji(vuln.severity);
            const fixAvailable = vuln.fixAvailable ? 
                (typeof vuln.fixAvailable === 'object' ? 
                    `✅ v${vuln.fixAvailable.version}` : 
                    '✅ Yes') : 
                '❌ No';
            
            const description = getVulnerabilityDescription(vuln);
            const range = vuln.range || 'N/A';
            
            report += `| \`${packageName}\` | ${severity} | \`${range}\` | ${fixAvailable} | ${description} |\n`;
        });
        
        report += "\n";
        
        // Fix command
        if (Object.values(vulnerabilities).some((vuln: Vulnerability) => vuln.fixAvailable)) {
            report += "### 🔧 Recommended Action\n\n";
            report += "Run the following command to fix vulnerabilities:\n";
            report += "```bash\n";
            report += "npm audit fix\n";
            report += "```\n\n";
        }
        
        // Dependencies summary
        if (auditData.metadata?.dependencies) {
            const deps = auditData.metadata.dependencies;
            report += "### 📦 Dependencies Overview\n\n";
            report += `- **Total packages**: ${deps.total || 0}\n`;
            report += `- **Production**: ${deps.prod || 0}\n`;
            report += `- **Development**: ${deps.dev || 0}\n`;
        }
        
        return report;
        
    } catch (error) {
        console.error('Failed to parse audit output:', error);
        return `## ⚠️ NPM Audit Report (Raw Output)\n\n\`\`\`\n${auditOutput}\n\`\`\``;
    }
}

const getSeverityEmoji = (severity: string): string => {
    switch (severity?.toLowerCase()) {
        case 'critical': return '🔴 Critical';
        case 'high': return '🟠 High';
        case 'moderate': return '🟡 Moderate';
        case 'low': return '🟢 Low';
        case 'info': return 'ℹ️ Info';
        default: return `⚪ ${severity || 'Unknown'}`;
    }
}

const getVulnerabilityDescription = (vuln: Vulnerability): string => {
    if (vuln.via && Array.isArray(vuln.via)) {
        const directVuln = vuln.via.find((v: string | VulnerabilitySource) => typeof v === 'object' && 'title' in v) as VulnerabilitySource | undefined;
        if (directVuln) {
            return directVuln.title.substring(0, 100) + (directVuln.title.length > 100 ? '...' : '');
        }
    }
    
    if (vuln.via && vuln.via.length > 0) {
        return `Vulnerable via: ${Array.isArray(vuln.via) ? vuln.via.filter((v: string | VulnerabilitySource) => typeof v === 'string').join(', ') : vuln.via}`;
    }
    
    return 'No description available';
}

main(process.argv[2]);