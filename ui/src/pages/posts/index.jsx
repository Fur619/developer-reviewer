import api from 'api';
import axios from 'axios';
import useSWRInfinite from 'swr/infinite';

import { Spin } from 'components';
import Post from './Post';
import { useState, useRef, useCallback } from 'react';
import Lightbox from 'react-image-lightbox';
import { CircularProgress } from '@mui/material';
import 'react-image-lightbox/style.css';
import HorizontalPost from './HorizontalPost';
import DialogComponent from './DialogComponent';

const Posts = () => {
  const fetcher = async url => {
    setLoading(true);
    const { data } = await axios.get(url);
    setTotalRecords(data?.count || 0);
    setLoading(false);
    return data;
  };

  const observer = useRef();
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [openImages, setOpenImages] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const { data: Result, size, setSize } = useSWRInfinite(index => api.getPostsUrl(index + 1), fetcher);
  const mergeRecords = [];
  Result?.forEach(res => mergeRecords.push(...res?.rows));
  const images = mergeRecords?.map(post => post?.url);

  const lastElementRef = useCallback(
    node => {
      if (observer.current) observer.current?.disconnect();
      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && mergeRecords.length < totalRecords && !loading) {
          setSize(size + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, size]
  );

  return (
    <>
      <Spin spinning={!Result}>
        <DialogComponent open={open} setOpen={setOpen}>
          <HorizontalPost open={open} setOpen={setOpen} setOpenImages={setOpenImages} mergeRecords={mergeRecords} lastElementRef={lastElementRef} setPhotoIndex={setPhotoIndex} loading={loading} />
        </DialogComponent>

        <div className="flex flex-col gap-3">
          {mergeRecords?.map((post, index) => (
            <div key={post.id} ref={index === mergeRecords?.length - 1 ? lastElementRef : null}>
              <Post open={open} post={post} setOpen={setOpen} />
            </div>
          ))}
          <div className="grid place-items-center py-4">{loading && <CircularProgress />}</div>
        </div>
      </Spin>

      {!!images?.length && openImages && <Lightbox clickOutsideToClose={false} mainSrc={images[photoIndex]} nextSrc={images[(photoIndex + 1) % images.length]} prevSrc={images[(photoIndex + images.length - 1) % images.length]} onCloseRequest={() => setOpenImages(false)} onMovePrevRequest={() => setPhotoIndex((photoIndex + images.length - 1) % images.length)} onMoveNextRequest={() => setPhotoIndex((photoIndex + 1) % images.length)} />}
    </>
  );
};

export default Posts;
