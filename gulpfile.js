const gulp = require('gulp');
const rigger = require('gulp-rigger');
const fileinclude = require('gulp-file-include');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const gutil = require('gulp-util');
const plumber = require('gulp-plumber');
const stylus = require('gulp-stylus');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const rimraf = require('gulp-rimraf');
const uglifycss = require('gulp-uglifycss');
const smartgrid = require('smart-grid');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;

const path = {
    root: './src/',
    vendor: {
        js: 'src/js/',
        css: 'src/manager/assets/dist/css/',
        html: 'src/*.html',
    },
    dist: { //Тут мы укажем куда складывать готовые после сборки файлы
        html: 'build/',
        clean: 'build/*',
        js: 'build/js/',
        styl: 'build/css/',
        css: 'build/css/',
        img: 'build/img/',
        fonts: 'build/fonts/'
    },
    app: { //Пути откуда брать исходники
        html: 'src/*.html', //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html
        js: 'src/js/*.js',//В стилях и скриптах нам понадобятся только main файлы
        comp: 'src/js/',//В стилях и скриптах нам понадобятся только main файлы
        lib: 'src/js/components/*.js',
        styl: 'src/precss/*.styl',
        css: 'src/css/*.css',
        img: 'src/img/**/*.*', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
        fonts: 'src/fonts/**/*.*'
    },
    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        html: 'src/**/*.html',
        jsComp: 'src/js/**/*.js',
        js: 'src/js/*.js',
        styl: 'src/precss/**/*.styl',
        css: 'src/css/**/*.css',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*'
    },
    smartgrid: {
        src: 'smartgrid.js',
        dest: 'precss/components'
    },
    clean: './build'
};

const config = {
    server: {
        baseDir: "./build"
    }
};

function google(){
    return gulp.src(path.vendor.html)
                .pipe(gulp.dest(path.dist.html));
}

function html(){
    gulp.src(path.app.html) //Выберем файлы по нужному пути
    return gulp.src(path.vendor.html)
        .pipe(rigger())
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(gulp.dest(path.dist.html)) //Выплюнем их в папку build
        .pipe(reload({stream: true}));
}

function jsComp(){
    return gulp.src(path.app.lib)
        .pipe(concat('script.js'))
        .pipe(uglify({
            toplevel: true
        }))
        .pipe(gulp.dest(path.dist.js))
        .pipe(browserSync.stream());
}

function js(){
    return gulp.src(path.app.js) //Найдем наш main файл
                //.pipe(sourcemaps.init()) //Инициализируем sourcemap
                .pipe(uglify({
                    toplevel: true
                })) //Сожмем наш js
                //.pipe(sourcemaps.write()) //Пропишем карты
                .pipe(gulp.dest(path.dist.js)) //Выплюнем готовый файл в build
                .pipe(browserSync.stream()); //И перезагрузим сервер
}

function styl(){
    return gulp.src(path.app.styl)
        .pipe(plumber())
        .pipe(stylus()) //Скомпилируем
        .pipe(autoprefixer({
            browsers: ['> 0.1%'],
            cascade: false
        }))
        .pipe(cleanCSS({
            level: 2
        }))
        .pipe(gulp.dest(path.dist.css))
        .pipe(browserSync.stream());
}

function css(){
    return gulp.src(path.watch.css)
                .pipe(uglifycss({
                    "maxLineLen": 80,
                    "uglyComments": true
                }))
                .pipe(gulp.dest(path.dist.css))
                .pipe(browserSync.stream());
}

function image(){
    return gulp.src(path.app.img) //Выберем наши картинки
                .pipe(imagemin({ //Сожмем их
                    progressive: true,
                    optimizationLevel: 5,
                    svgoPlugins: [{removeViewBox: false}],
                    use: [pngquant()],
                    interlaced: true
                }))
                .pipe(gulp.dest(path.dist.img)) //И бросим в build
                .pipe(browserSync.stream());
}

function fonts(){
    return gulp.src(path.app.fonts)
                .pipe(gulp.dest(path.dist.fonts))
}

function ccc(){
    return gulp.src(path.dist.clean)
                .pipe(rimraf());
}

function grid(){
    delete require.cache[require.resolve('./' + path.smartgrid.src)];
    let options = require('./' + path.smartgrid.src);
    smartgrid(path.root + path.smartgrid.dest, options);
}

function watch(){
    browserSync.init(config);
    gulp.watch(path.watch.html, html);
    gulp.watch(path.watch.styl, styl);
    gulp.watch(path.watch.css, css);
    gulp.watch(path.watch.jsComp, jsComp);
    gulp.watch(path.watch.js, js);
    gulp.watch(path.watch.img, image);
    gulp.watch(path.watch.fonts, fonts);
    gulp.watch(path.smartgrid.src, grid);
}

gulp.task('css', css);
gulp.task('js', js);
gulp.task('html', html);
gulp.task('jsComp', jsComp);
gulp.task('js', js);
gulp.task('styl', styl);
gulp.task('image', image);
gulp.task('ccc', ccc);
gulp.task('grid', grid);
gulp.task('watch', watch);

gulp.task('build', gulp.series(ccc,
    gulp.parallel(fonts, html, styl, css, jsComp, js, image)
));

gulp.task('default', gulp.series('build', 'watch'));