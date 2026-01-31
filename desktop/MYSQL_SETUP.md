# MySQL 安装和配置指南

桌面版应用需要本地MySQL数据库来存储视频处理任务和用户数据。

## Windows 安装MySQL

### 方法1：使用MySQL Installer（推荐）

1. **下载MySQL Installer**
   - 访问 [MySQL官网](https://dev.mysql.com/downloads/installer/)
   - 下载 `mysql-installer-community-8.0.xx.msi`

2. **安装MySQL**
   - 运行安装程序
   - 选择 "Developer Default" 或 "Server only"
   - 设置root密码（记住这个密码，后面需要用）
   - 完成安装

3. **验证安装**
   ```cmd
   mysql --version
   ```

### 方法2：使用Chocolatey

```powershell
# 安装Chocolatey（如果还没有）
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装MySQL
choco install mysql
```

## Mac 安装MySQL

### 方法1：使用Homebrew（推荐）

```bash
# 安装Homebrew（如果还没有）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装MySQL
brew install mysql

# 启动MySQL服务
brew services start mysql

# 设置root密码
mysql_secure_installation
```

### 方法2：使用DMG安装包

1. 访问 [MySQL官网](https://dev.mysql.com/downloads/mysql/)
2. 下载Mac版本的DMG安装包
3. 运行安装程序
4. 记住安装时设置的root密码

## Linux 安装MySQL

### Ubuntu/Debian

```bash
# 更新包列表
sudo apt update

# 安装MySQL
sudo apt install mysql-server

# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 设置root密码
sudo mysql_secure_installation
```

### CentOS/RHEL

```bash
# 安装MySQL
sudo yum install mysql-server

# 启动MySQL服务
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 获取临时密码
sudo grep 'temporary password' /var/log/mysqld.log

# 设置root密码
mysql_secure_installation
```

## 创建数据库

安装完MySQL后，需要创建应用使用的数据库：

```bash
# 登录MySQL
mysql -u root -p

# 输入密码后，执行以下SQL命令：
CREATE DATABASE video_slicer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 退出MySQL
EXIT;
```

## 配置应用

1. **复制环境变量文件**
   ```bash
   # 在desktop目录下
   cp env.example.txt .env
   ```

2. **编辑.env文件**
   ```env
   DATABASE_URL=mysql://root:your_password@localhost:3306/video_slicer
   ```
   
   将 `your_password` 替换为你的MySQL root密码

3. **测试连接**
   启动应用后，如果能正常访问首页，说明数据库连接成功。

## 常见问题

### 1. 无法连接到MySQL

**错误信息**: `Error: connect ECONNREFUSED 127.0.0.1:3306`

**解决方案**:
- 确认MySQL服务正在运行
  - Windows: 打开"服务"管理器，查找"MySQL"服务
  - Mac/Linux: `sudo systemctl status mysql`
- 如果服务未运行，启动它
  - Windows: 在服务管理器中启动
  - Mac: `brew services start mysql`
  - Linux: `sudo systemctl start mysql`

### 2. 密码错误

**错误信息**: `Error: Access denied for user 'root'@'localhost'`

**解决方案**:
- 重置MySQL root密码
  ```bash
  # 停止MySQL服务
  sudo systemctl stop mysql
  
  # 以安全模式启动MySQL
  sudo mysqld_safe --skip-grant-tables &
  
  # 登录MySQL（无需密码）
  mysql -u root
  
  # 重置密码
  ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
  FLUSH PRIVILEGES;
  EXIT;
  
  # 重启MySQL
  sudo systemctl restart mysql
  ```

### 3. 数据库不存在

**错误信息**: `Error: Unknown database 'video_slicer'`

**解决方案**:
- 按照上面的"创建数据库"步骤创建数据库

### 4. 字符集问题

如果遇到中文乱码，确保数据库使用UTF8MB4字符集：

```sql
ALTER DATABASE video_slicer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 数据库备份

定期备份数据库以防数据丢失：

```bash
# 备份数据库
mysqldump -u root -p video_slicer > backup_$(date +%Y%m%d).sql

# 恢复数据库
mysql -u root -p video_slicer < backup_20240131.sql
```

## 数据库管理工具

推荐使用以下工具管理MySQL数据库：

- **MySQL Workbench**: 官方图形化管理工具
- **DBeaver**: 免费开源的数据库管理工具
- **phpMyAdmin**: Web界面管理工具
- **HeidiSQL**: Windows平台轻量级工具

## 性能优化

对于大量视频处理任务，可以优化MySQL配置：

编辑 `my.cnf` 或 `my.ini` 文件：

```ini
[mysqld]
# 增加最大连接数
max_connections = 200

# 增加缓冲池大小（根据可用内存调整）
innodb_buffer_pool_size = 1G

# 增加日志文件大小
innodb_log_file_size = 256M
```

重启MySQL使配置生效。

## 安全建议

1. **不要使用root用户**
   
   创建专用数据库用户：
   ```sql
   CREATE USER 'video_slicer'@'localhost' IDENTIFIED BY 'strong_password';
   GRANT ALL PRIVILEGES ON video_slicer.* TO 'video_slicer'@'localhost';
   FLUSH PRIVILEGES;
   ```
   
   然后在.env中使用：
   ```env
   DATABASE_URL=mysql://video_slicer:strong_password@localhost:3306/video_slicer
   ```

2. **使用强密码**
   - 至少12个字符
   - 包含大小写字母、数字和特殊字符

3. **定期更新MySQL**
   - 及时安装安全补丁

4. **限制远程访问**
   - 只允许本地连接（默认配置）

## 获取帮助

如果遇到问题，可以：

1. 查看MySQL错误日志
   - Windows: `C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err`
   - Mac: `/usr/local/var/mysql/*.err`
   - Linux: `/var/log/mysql/error.log`

2. 访问MySQL官方文档: https://dev.mysql.com/doc/

3. 在GitHub Issues中提问: https://github.com/your-repo/issues
