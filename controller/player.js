const Player = require('../model/player');



// const socket = require('../socket');






exports.signup = async (req, res, next) =>
{
    try
    {
        const { username, email, password } = req.body;
        console.log(req.body);
        // قم بإنشاء لاعب جديد باستخدام بيانات الطلب
        const player = new Player({
            username: username,
            email: email,
            password: password
        });

        // قم بحفظ اللاعب في قاعدة البيانات
        await player.save();

        // إرسال رد ناجح باللاعب المحفوظ
        res.status(201).json({
            message: "Player signed up successfully"

        });
    } catch (error)
    {
        // في حالة حدوث خطأ، أرسل رسالة خطأ مع الكود الخاص بالخطأ
        res.status(500).json({
            message: "Signup failed"
        });
        console.log(error.message);

    }
};




exports.login = async (req, res, next) =>
{
    try
    {
        const { email, password } = req.body;
        console.log(req.body);

        // ابحث عن اللاعب باستخدام اسم المستخدم وكلمة المرور
        const player = await Player.findOne({ email: email, password: password });

        // إذا تم العثور على اللاعب، أرسل رداً ناجحاً مع بيانات اللاعب
        if (player)
        {
            res.status(200).json({
                message: "Login successfusssssssl", player: player
            });
        } else
        {
            // إذا لم يتم العثور على اللاعب، أرسل رداً برسالة خطأ
            res.status(401).json({
                message: "Invalid username or password"
            });
        }
    } catch (error)
    {
        // في حالة حدوث خطأ، أرسل رسالة خطأ مع الكود الخاص بالخطأ
        res.status(500).json({
            message: "Login failed"
        });
    }
};


