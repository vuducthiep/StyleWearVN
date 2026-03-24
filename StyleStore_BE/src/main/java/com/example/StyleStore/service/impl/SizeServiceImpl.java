package com.example.StyleStore.service.impl;

import com.example.StyleStore.model.Size;
import com.example.StyleStore.repository.SizeRepository;
import com.example.StyleStore.service.SizeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SizeServiceImpl implements SizeService {

    @Autowired
    private SizeRepository sizeRepository;

    @Override
    public List<Size> getAllSizes() {
        return sizeRepository.findAll();
    }
}
