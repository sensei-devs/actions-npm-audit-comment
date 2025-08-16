"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@actions/core");
var github_1 = require("@actions/github");
var main = function (projectName) { return __awaiter(void 0, void 0, void 0, function () {
    var stdin, auditJson;
    return __generator(this, function (_a) {
        stdin = process.openStdin();
        auditJson = "";
        stdin.on('data', function (chunk) {
            auditJson += chunk;
        });
        stdin.on('end', function () { return __awaiter(void 0, void 0, void 0, function () {
            var message, formattedMessage, github_token, pull_request_number;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        message = auditJson;
                        formattedMessage = formatAuditReport(message, projectName);
                        github_token = core_1.getInput('github_token');
                        if (github_1.context.payload.pull_request == null) {
                            core_1.setFailed('No pull request found.');
                            return [2 /*return*/];
                        }
                        pull_request_number = github_1.context.payload.pull_request.number;
                        return [4 /*yield*/, createCommentOnPr(github_1.context.repo, pull_request_number, formattedMessage, github_token)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); };
var createCommentOnPr = function (repoContext, prNumber, message, token) { return __awaiter(void 0, void 0, void 0, function () {
    var octokit, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                octokit = github_1.getOctokit(token);
                return [4 /*yield*/, octokit.issues.createComment(__assign(__assign({}, repoContext), { issue_number: prNumber, body: message }))];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                core_1.setFailed(error_1 instanceof Error ? error_1.message : 'Unknown error occurred');
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
var formatAuditReport = function (auditOutput, projectName) {
    var _a, _b;
    try {
        var auditData = JSON.parse(auditOutput);
        if (!auditData.vulnerabilities || Object.keys(auditData.vulnerabilities).length === 0) {
            return "\u2705 **No vulnerabilities found in " + projectName + "** Your dependencies are secure.";
        }
        var vulnerabilities = auditData.vulnerabilities;
        var metadata = ((_a = auditData.metadata) === null || _a === void 0 ? void 0 : _a.vulnerabilities) || {};
        var report_1 = "## 🔍 NPM Audit Report for: " + projectName + "\n\n";
        // Summary table
        report_1 += "### 📊 Summary\n\n";
        report_1 += "| Severity | Count |\n";
        report_1 += "|----------|-------|\n";
        if (metadata.critical > 0)
            report_1 += "| \uD83D\uDD34 Critical | " + metadata.critical + " |\n";
        if (metadata.high > 0)
            report_1 += "| \uD83D\uDFE0 High | " + metadata.high + " |\n";
        if (metadata.moderate > 0)
            report_1 += "| \uD83D\uDFE1 Moderate | " + metadata.moderate + " |\n";
        if (metadata.low > 0)
            report_1 += "| \uD83D\uDFE2 Low | " + metadata.low + " |\n";
        if (metadata.info > 0)
            report_1 += "| \u2139\uFE0F Info | " + metadata.info + " |\n";
        report_1 += "| **Total** | **" + (metadata.total || 0) + "** |\n\n";
        // Detailed vulnerabilities table
        report_1 += "### 🚨 Vulnerability Details\n\n";
        report_1 += "| Package | Severity | Current Range | Fix Available | Description |\n";
        report_1 += "|---------|----------|---------------|---------------|-------------|\n";
        Object.entries(vulnerabilities).forEach(function (_a) {
            var packageName = _a[0], vuln = _a[1];
            var severity = getSeverityEmoji(vuln.severity);
            var fixAvailable = vuln.fixAvailable ?
                (typeof vuln.fixAvailable === 'object' ?
                    "\u2705 v" + vuln.fixAvailable.version :
                    '✅ Yes') :
                '❌ No';
            var description = getVulnerabilityDescription(vuln);
            var range = vuln.range || 'N/A';
            report_1 += "| `" + packageName + "` | " + severity + " | `" + range + "` | " + fixAvailable + " | " + description + " |\n";
        });
        report_1 += "\n";
        // Fix command
        if (Object.values(vulnerabilities).some(function (vuln) { return vuln.fixAvailable; })) {
            report_1 += "### 🔧 Recommended Action\n\n";
            report_1 += "Run the following command to fix vulnerabilities:\n";
            report_1 += "```bash\n";
            report_1 += "npm audit fix\n";
            report_1 += "```\n\n";
        }
        // Dependencies summary
        if ((_b = auditData.metadata) === null || _b === void 0 ? void 0 : _b.dependencies) {
            var deps = auditData.metadata.dependencies;
            report_1 += "### 📦 Dependencies Overview\n\n";
            report_1 += "- **Total packages**: " + (deps.total || 0) + "\n";
            report_1 += "- **Production**: " + (deps.prod || 0) + "\n";
            report_1 += "- **Development**: " + (deps.dev || 0) + "\n";
        }
        return report_1;
    }
    catch (error) {
        console.error('Failed to parse audit output:', error);
        return "## \u26A0\uFE0F NPM Audit Report (Raw Output)\n\n```\n" + auditOutput + "\n```";
    }
};
var getSeverityEmoji = function (severity) {
    switch (severity === null || severity === void 0 ? void 0 : severity.toLowerCase()) {
        case 'critical': return '🔴 Critical';
        case 'high': return '🟠 High';
        case 'moderate': return '🟡 Moderate';
        case 'low': return '🟢 Low';
        case 'info': return 'ℹ️ Info';
        default: return "\u26AA " + (severity || 'Unknown');
    }
};
var getVulnerabilityDescription = function (vuln) {
    if (vuln.via && Array.isArray(vuln.via)) {
        var directVuln = vuln.via.find(function (v) { return typeof v === 'object' && 'title' in v; });
        if (directVuln) {
            return directVuln.title.substring(0, 100) + (directVuln.title.length > 100 ? '...' : '');
        }
    }
    if (vuln.via && vuln.via.length > 0) {
        return "Vulnerable via: " + (Array.isArray(vuln.via) ? vuln.via.filter(function (v) { return typeof v === 'string'; }).join(', ') : vuln.via);
    }
    return 'No description available';
};
main(process.argv[2]);
