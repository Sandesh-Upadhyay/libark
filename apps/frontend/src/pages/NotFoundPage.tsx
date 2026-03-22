import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/atoms';
import { PageLayoutTemplate } from '@/components/templates/layout-templates';
import { staggerContainer, staggerItem } from '@/lib/motion-presets';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <PageLayoutTemplate constrainWidth={false} requireAuth={false}>
      <div className='min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center px-4'>
        <motion.div
          initial='hidden'
          animate='visible'
          variants={staggerContainer}
          className='max-w-lg w-full text-center'
        >
          {/* アイコン */}
          <motion.div variants={staggerItem} className='mb-6'>
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
              className='inline-block'
            >
              <div className='w-24 h-24 mx-auto rounded-full bg-accent/10 flex items-center justify-center'>
                <Search className='w-12 h-12 text-accent' />
              </div>
            </motion.div>
          </motion.div>

          {/* 404番号 */}
          <motion.h1
            variants={staggerItem}
            className='text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-4'
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          >
            404
          </motion.h1>

          {/* タイトル */}
          <motion.h2
            variants={staggerItem}
            className='text-2xl md:text-3xl font-semibold text-foreground mb-4'
          >
            {t('notFound.title', { default: 'ページが見つかりません' })}
          </motion.h2>

          {/* 説明文 */}
          <motion.p
            variants={staggerItem}
            role='alert'
            aria-live='polite'
            className='text-base md:text-lg text-muted-foreground mb-8'
          >
            {t('notFound.description', {
              default: 'お探しのページは存在しないか、移動された可能性があります。',
            })}
          </motion.p>

          {/* アクションボタン */}
          <motion.div
            variants={staggerItem}
            className='flex flex-col sm:flex-row gap-3 justify-center'
          >
            <Link to='/'>
              <Button size='lg' className='flex items-center gap-2'>
                <Home className='w-5 h-5' />
                {t('common.backToHome', { default: 'ホームに戻る' })}
              </Button>
            </Link>
            <Button
              size='lg'
              variant='outline'
              onClick={() => window.history.back()}
              className='flex items-center gap-2'
            >
              <ArrowLeft className='w-5 h-5' />
              前のページに戻る
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </PageLayoutTemplate>
  );
};

export default NotFoundPage;
