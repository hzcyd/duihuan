// 导入 Supabase 客户端库
// Vercel 会自动从 package.json 中安装它
import { createClient } from '@supabase/supabase-js';

// 这是 Vercel Serverless Function 的主处理函数
export default async function handler(request, response) {
    
    // 只允许 POST 请求
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 1. 从 Vercel 环境变量中安全地获取 Supabase 凭据
        // (您必须在 Vercel 项目设置中配置这些)
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase 凭据未在环境变量中设置');
        }

        // 2. 从前端请求体中解析数据
        const { code, name, phone, address } = request.body;

        if (!code || !name || !phone || !address) {
            return response.status(400).json({ error: '缺少必要信息' });
        }

        // 3. 创建 Supabase 管理员客户端 (使用 service_role 密钥)
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 4. (关键) 调用我们在 SQL 中创建的 'redeem_coupon' 数据库函数
        // [FIXED] 移除了 'error' 后面多余的下划线
        const { data, error } = await supabase.rpc('redeem_coupon', {
            coupon_code: code,
            user_name: name,
            user_phone: phone,
            user_address: address
        });

        // 5. 处理数据库函数的响应
        if (error) {
            // 如果 rpc 本身出错
            console.error('Supabase RPC Error:', error);
            throw new Error('数据库函数执行失败: ' + error.message);
        }

        // [CHANGED] 数据库函数现在返回产品名称,
        // 或者返回 'INVALID_OR_REDEEMED' / 'ERROR'
        
        if (data === 'INVALID_OR_REDEEMED') {
            // 兑换券无效或已被使用
            return response.status(400).json({ error: '兑换券无效或已被使用' });
        } else if (data === 'ERROR') {
            // 数据库函数内部发生异常
            return response.status(500).json({ error: '服务器内部错误：兑换时发生错误' });
        } else if (data) {
            // 兑换成功, data 变量现在是产品名称字符串
            // 我们不需要将产品名称传回前端（因为前端已经有了），
            // 但我们知道操作已成功。
            return response.status(200).json({ success: true, message: '兑换成功' });
        } else {
            // 数据库函数返回了意外的结果 (例如 null)
            return response.status(500).json({ error: '服务器内部错误：未知的兑换结果' });
        }

    } catch (error) {
        // 捕获任何 JavaScript 运行时错误
        console.error('Handler Error:', error);
        return response.status(500).json({ error: error.message || '服务器内部错误' });
    }
}