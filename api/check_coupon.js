// 导入 Supabase 客户端库
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
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase 凭据未在环境变量中设置');
        }

        // 2. 从前端请求体中解析数据
        const { code } = request.body;

        if (!code) {
            return response.status(400).json({ error: '缺少兑换券码' });
        }

        // 3. 创建 Supabase 管理员客户端
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 4. (关键) 直接查询 'coupons' 表
        // [CHANGED] 我们现在也 select 'product_name'
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('code, is_redeemed, product_name') // <--- 修改点
            .eq('code', code)
            .single(); // .single() 期望只找到一行，否则会报错

        // 5. 处理查询结果
        if (error || !coupon) {
            // 没找到兑换券 (error 会被触发)
            console.error('Supabase query error:', error);
            return response.status(404).json({ error: '兑换券不存在' });
        }

        if (coupon.is_redeemed) {
            // 兑换券已被使用
            return response.status(400).json({ error: '此兑换券已被使用' });
        }

        // 6. 兑换券有效且未使用
        // [CHANGED] 在响应中添加 productName
        return response.status(200).json({ 
            success: true, 
            code: coupon.code,
            productName: coupon.product_name || '精美礼品' // <--- 新增 (如果名称为空，提供默认值)
        });

    } catch (error) {
        // 捕获任何 JavaScript 运行时错误
        console.error('Handler Error:', error);
        // .single() 找不到行时也会抛错，这里统一处理
        if (error.code === 'PGRST116') {
             return response.status(404).json({ error: '兑换券不存在' });
        }
        return response.status(500).json({ error: error.message || '服务器内部错误' });
    }
}