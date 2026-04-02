/**
 * Email Templates for Shyama ERP Notification System
 * Using premium aesthetics: Dynamic HSL colors, polished typography, and responsive layouts.
 */

interface TemplateParams {
    title: string;
    message: string;
    details: Array<{ label: string; value: string }>;
    actionUrl?: string;
    actionText?: string;
    isApology?: boolean;
}

export const getBaseEmailTemplate = ({
    title,
    message,
    details,
    actionUrl,
    actionText,
    isApology = false
}: TemplateParams) => {
    // Premium Color Palette (HSL)
    const primaryColor = isApology ? '340 75% 55%' : '210 100% 50%'; // Deep Pink/Red for Apology, Vibrant Blue for Alert
    const secondaryColor = '220 15% 15%'; // Dark blue-gray for background
    const accentColor = isApology ? '340 80% 90%' : '210 100% 95%';

    const detailRows = details
        .map(
            (d) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px 0; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; width: 35%;">${d.label}</td>
            <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 600;">${d.value}</td>
        </tr>
    `
        )
        .join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Main Container -->
                <table role="presentation" width="100%" maxWidth="600px" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px; background: linear-gradient(135deg, hsl(${primaryColor}), hsl(${primaryColor} / 0.8));">
                             <div style="font-size: 12px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px;">SHYAMA ERP SYSTEM</div>
                             <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">${title}</h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <div style="background-color: hsl(${accentColor}); border-left: 4px solid hsl(${primaryColor}); padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                                <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6; font-weight: 500;">
                                    ${message}
                                </p>
                            </div>

                            <!-- Details Table -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 30px;">
                                ${detailRows}
                            </table>

                            <!-- Action Button -->
                            ${actionUrl ? `
                            <div align="center" style="margin-top: 40px;">
                                <a href="${actionUrl}" style="display: inline-block; padding: 16px 32px; background-color: hsl(${primaryColor}); color: #ffffff; text-decoration: none; border-radius: 14px; font-size: 14px; font-weight: 700; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); transition: all 0.2s;">
                                    ${actionText || 'View Details'}
                                </a>
                            </div>
                            ` : ''}
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f1f5f9; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                                This is an automated notification from <strong>SHYAMA INDUSTRIES ERP</strong>.<br/>
                                Please do not reply directly to this email.
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Copyright -->
                <p style="margin-top: 24px; font-size: 11px; color: #cbd5e1; text-align: center; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em;">
                    © ${new Date().getFullYear()} SHYAMA INDUSTRIES. ALL RIGHTS RESERVED.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};
