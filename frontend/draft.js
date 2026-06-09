router.post('/admin/add-user', verifyToken, async (req, res) => {
    try {
        const { fullname, email, password } = req.body

        if (!email || !password) {
            res.status(400).json({ error: 'Missing fields!' })
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        await authHelper.register(fullname, email, password, true)

        return res.status(201).json({ message: 'Admin account created!' })
    } catch (error) {
        console.error('Error admin register: ', error)
        return res.status(400).json({ error: error.message })
    }
})